import { supabase } from '@/services/supabase';
import { createSignedFileUrl, uploadContributionFile } from '@/services/storage';
import type { Subject } from '@/data/subjects';

export type ApprovedFile = {
  id: string;
  original_name: string;
  size_bytes: number;
  url: string;
};

export type ApprovedContribution = {
  id: string;
  title: string;
  description: string;
  profiles: { alias: string } | null;
  files: ApprovedFile[];
};

export type LegacyMaterial = {
  id: string;
  title: string;
  path: string | null;
  external_url: string | null;
  content_text: string | null;
  contributed_at: string;
  profiles: { alias: string } | null;
};

export type PendingContribution = {
  id: string;
  title: string;
  description: string;
  review_note: string | null;
  created_at: string;
  profiles: { alias: string } | null;
  subjects: { acronym: string; name: string } | null;
  contribution_files: (Omit<ApprovedFile, 'url'> & { storage_path: string })[];
};

function client() {
  if (!supabase) {
    throw new Error(
      'Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per gestionar les aportacions.',
    );
  }
  return supabase;
}

/** Loads the subjects list used to populate the contribution form. */
export async function listSubjectsForContribution(): Promise<Subject[]> {
  const { data, error } = await client()
    .from('subjects')
    .select('id,slug,acronym,code,name,category,description,languages,specialty,is_current')
    .order('acronym');
  if (error) throw new Error(`No s’han pogut carregar les assignatures: ${error.message}`);
  return (data ?? []) as Subject[];
}

/** Loads approved contributions (with signed file URLs) and legacy materials for a subject. */
export async function fetchApprovedMaterials(subjectId: string): Promise<{
  contributions: ApprovedContribution[];
  legacyMaterials: LegacyMaterial[];
}> {
  const db = client();
  const [approvedResult, legacyResult] = await Promise.all([
    db
      .from('contributions')
      .select(
        'id,title,description,profiles(alias),contribution_files(id,original_name,storage_path,size_bytes)',
      )
      .eq('subject_id', subjectId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    db
      .from('legacy_material_subjects')
      .select(
        'legacy_materials(id,title,path,external_url,content_text,contributed_at,profiles(alias))',
      )
      .eq('subject_id', subjectId),
  ]);

  if (approvedResult.error) throw approvedResult.error;
  if (legacyResult.error) throw legacyResult.error;

  const contributions = await Promise.all(
    (approvedResult.data ?? []).map(async (entry) => {
      const files = await Promise.all(
        (entry.contribution_files ?? []).map(async (file) => ({
          id: file.id,
          original_name: file.original_name,
          size_bytes: Number(file.size_bytes),
          url: await createSignedFileUrl(file.storage_path),
        })),
      );
      return {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        profiles: entry.profiles,
        files,
      };
    }),
  );

  const legacyMaterials = (legacyResult.data ?? [])
    .map((entry) => entry.legacy_materials)
    .filter((item) => item && !item.path) as unknown as LegacyMaterial[];

  return { contributions, legacyMaterials };
}

/** Loads the pending contributions queue for administrators, with signed file URLs. */
export async function fetchPendingContributions(): Promise<PendingContribution[]> {
  const db = client();
  const { data, error } = await db
    .from('contributions')
    .select(
      'id,title,description,review_note,created_at,profiles(alias),subjects(acronym,name),contribution_files(id,original_name,size_bytes,storage_path)',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return Promise.all(
    ((data ?? []) as unknown as PendingContribution[]).map(async (item) => {
      const contribution_files = await Promise.all(
        item.contribution_files.map(async (file) => ({
          ...file,
          url: await createSignedFileUrl(file.storage_path),
        })),
      );
      return { ...item, contribution_files };
    }),
  );
}

export type ContributionInput = {
  authorId: string;
  subjectId: string;
  title: string;
  description: string;
  files: File[];
};

/** Creates a contribution and uploads its files. Throws on the first failure. */
export async function submitContribution(input: ContributionInput): Promise<void> {
  const db = client();
  const { data: contribution, error } = await db
    .from('contributions')
    .insert({
      author_id: input.authorId,
      subject_id: input.subjectId,
      title: input.title,
      description: input.description,
    })
    .select('id')
    .single();
  if (error) throw error;

  for (const file of input.files) {
    const path = `${input.authorId}/${contribution.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
    await uploadContributionFile(path, file);
    const { error: registerError } = await db.from('contribution_files').insert({
      contribution_id: contribution.id,
      storage_path: path,
      original_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
    });
    if (registerError) throw registerError;
  }
}

/**
 * Reviews a pending contribution. Returns `false` when the row was already
 * reviewed by someone else (no longer pending), `true` when it was updated.
 */
export async function reviewContribution(
  id: string,
  status: 'approved' | 'rejected',
  reviewNote: string | null,
): Promise<boolean> {
  const { data, error } = await client()
    .from('contributions')
    .update({
      status,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
