do $$
declare
  table_name text;
  rls_enabled boolean;
  admin_rpc_is_definer boolean;
  ranking_view_is_invoker boolean;
begin
  foreach table_name in array array[
    'subjects',
    'profiles',
    'contributions',
    'contribution_files',
    'legacy_materials',
    'legacy_material_subjects'
  ] loop
    select c.relrowsecurity
      into rls_enabled
      from pg_catalog.pg_class c
     where c.oid = to_regclass('public.' || table_name);

    if rls_enabled is distinct from true then
      raise exception 'RLS must be enabled on public.%', table_name;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.admin_list_users()', 'EXECUTE') then
    raise exception 'anon must not execute public.admin_list_users';
  end if;

  if not has_function_privilege('authenticated', 'public.admin_list_users()', 'EXECUTE') then
    raise exception 'authenticated must be able to call the role-guarded admin RPC';
  end if;

  select p.prosecdef
    into admin_rpc_is_definer
    from pg_catalog.pg_proc p
   where p.oid = 'public.admin_list_users()'::regprocedure;

  if admin_rpc_is_definer is distinct from true then
    raise exception 'public.admin_list_users must remain SECURITY DEFINER';
  end if;

  select c.reloptions @> array['security_invoker=true']
    into ranking_view_is_invoker
    from pg_catalog.pg_class c
   where c.oid = 'public.contributor_ranking'::regclass;

  if ranking_view_is_invoker is distinct from true then
    raise exception 'contributor_ranking must use security_invoker';
  end if;

  if not exists (
    select 1 from storage.buckets where id = 'contributions' and public = false
  ) then
    raise exception 'contributions storage bucket must remain private';
  end if;

  select c.relrowsecurity
    into rls_enabled
    from pg_catalog.pg_class c
   where c.oid = 'storage.objects'::regclass;

  if rls_enabled is distinct from true then
    raise exception 'RLS must be enabled on storage.objects';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users update own profile; superadmins manage profiles'
      and cmd = 'UPDATE'
  ) then
    raise exception 'profiles owner/superadmin update policy is missing';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'contributions'
      and policyname = 'Users can submit their own contributions'
      and cmd = 'INSERT'
  ) then
    raise exception 'contribution ownership insert policy is missing';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'contributions'
      and policyname = 'Admins and superadmins can review contributions'
      and cmd = 'UPDATE'
  ) then
    raise exception 'admin contribution-review policy is missing';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users upload to their own contribution folder'
      and cmd = 'INSERT'
  ) then
    raise exception 'owner-scoped contribution upload policy is missing';
  end if;

  if has_schema_privilege('anon', 'private', 'USAGE')
     or has_function_privilege('anon', 'private.current_user_role()', 'EXECUTE') then
    raise exception 'anonymous role must not access private role-checking objects';
  end if;
end;
$$;

begin;

do $$
declare
  test_user_id text;
begin
  select auth_user_id::text
    into test_user_id
    from public.profiles
    where role = 'user' and auth_user_id is not null
    order by created_at
    limit 1;

  if test_user_id is null then
    raise exception 'A regular authenticated profile is required for the RLS integration test.';
  end if;

  perform set_config('request.jwt.claim.sub', test_user_id, true);
end;
$$;
set local role authenticated;

do $$
declare
  rows_changed integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where auth_user_id = auth.uid() and role = 'user'
  ) then
    raise exception 'A regular authenticated profile is required for the RLS integration test.';
  end if;

  update public.profiles
     set alias = alias
   where auth_user_id = auth.uid();
  get diagnostics rows_changed = row_count;
  if rows_changed <> 1 then
    raise exception 'A regular user could not update their own profile.';
  end if;

  begin
    perform 1 from public.admin_list_users();
    raise exception 'A regular user unexpectedly executed the admin user-directory RPC.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.profiles set role = 'admin' where auth_user_id = auth.uid();
    get diagnostics rows_changed = row_count;
    if rows_changed > 0 then
      raise exception 'A regular user unexpectedly changed their own role.';
    end if;
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

rollback;

begin;
do $$
declare
  superadmin_id text;
begin
  select auth_user_id::text
    into superadmin_id
    from public.profiles
    where role = 'superadmin' and auth_user_id is not null
    limit 1;
  if superadmin_id is null then
    raise exception 'A configured superadmin profile is required for the RLS integration test.';
  end if;
  perform set_config('request.jwt.claim.sub', superadmin_id, true);
end;
$$;
set local role authenticated;

do $$
declare
  rows_returned integer;
begin
  if (select private.current_user_role()) is distinct from 'superadmin' then
    raise exception 'The configured superadmin role could not be resolved.';
  end if;

  perform 1 from public.admin_list_users();
  get diagnostics rows_returned = row_count;
  if rows_returned < 1 then
    raise exception 'The superadmin RPC did not return a user row.';
  end if;
end;
$$;

rollback;
