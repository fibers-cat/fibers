import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")?.trim();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const CORAL = 0xe94b50;
const TEAL = 0x158b84;

serve(async (req) => {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET.length < 32) {
    return new Response("Webhook authentication is not configured", { status: 503 });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }
  const providedSecret = req.headers.get("x-webhook-secret");
  if (!providedSecret || providedSecret !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!WEBHOOK_URL) {
    return new Response("Missing DISCORD_WEBHOOK_URL", { status: 500 });
  }

  let payload: { type?: string; table?: string; record?: Record<string, unknown> } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const table = payload.table ?? "unknown";
  const record = payload.record ?? {};
  const type = payload.type ?? "INSERT";
  if (type !== "INSERT" || !["profiles", "contributions"].includes(table)) {
    return new Response("Unsupported webhook event", { status: 400 });
  }

  let embed: Record<string, unknown> = {
    color: CORAL,
    timestamp: new Date().toISOString(),
  };

  if (table === "profiles") {
    const alias = (record.alias as string) ?? "—";
    const userId = (record.id ?? record.auth_user_id) as string | undefined;
    const avatarUrl = (record.avatar_url as string) ?? null;
    const role = (record.role as string) ?? "user";
    const createdAt = (record.created_at as string) ?? null;

    let email: string | null = null;
    if (userId && supabase) {
      try {
        const { data } = await supabase.auth.admin.getUserById(userId);
        email = data?.user?.email ?? null;
      } catch {
        email = null;
      }
    }

    embed = {
      title: "👤 Nou usuari registrat",
      description: `**${alias}** s'ha unit a Fibers.`,
      color: TEAL,
      timestamp: createdAt ?? new Date().toISOString(),
      thumbnail: avatarUrl ? { url: avatarUrl } : undefined,
      fields: [
        { name: "Àlies", value: alias, inline: true },
        { name: "Rol", value: role, inline: true },
        { name: "ID", value: userId ?? "—", inline: false },
        ...(email ? [{ name: "Correu", value: email, inline: false }] : []),
      ],
      footer: { text: "Fibers · Registre d'usuaris" },
    };
  } else if (table === "contributions") {
    const title = (record.title as string) ?? "—";
    const description = String(record.description ?? "").slice(0, 500);
    const authorId = record.author_id as string | undefined;
    const subjectId = record.subject_id as string | undefined;
    const contributionId = record.id as string | undefined;
    const status = (record.status as string) ?? "pending";
    const createdAt = (record.created_at as string) ?? null;

    let authorAlias: string | null = null;
    let authorEmail: string | null = null;
    let subjectLabel: string | null = null;
    if (supabase) {
      if (authorId) {
        const { data } = await supabase.from("profiles").select("alias").eq("id", authorId).maybeSingle();
        authorAlias = data?.alias ?? null;
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(authorId);
          authorEmail = userData?.user?.email ?? null;
        } catch {
          authorEmail = null;
        }
      }
      if (subjectId) {
        const { data } = await supabase.from("subjects").select("acronym,name").eq("id", subjectId).maybeSingle();
        if (data) subjectLabel = `${data.acronym} — ${data.name}`;
      }
    }

    // Wait briefly so the contribution_files rows (inserted right after) exist.
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let files: Array<{ original_name: string; storage_path: string; size_bytes: number }> = [];
    if (contributionId && supabase) {
      for (let attempt = 0; attempt < 4; attempt++) {
        await sleep(attempt === 0 ? 1500 : 1000);
        const { data } = await supabase
          .from("contribution_files")
          .select("original_name,storage_path,size_bytes")
          .eq("contribution_id", contributionId);
        if (data && data.length > 0) {
          files = data as typeof files;
          break;
        }
      }
    }

    // Build signed links for the attachments.
    const fileLinks: string[] = [];
    if (supabase && files.length > 0) {
      for (const file of files) {
        const { data } = await supabase.storage
          .from("contributions")
          .createSignedUrl(file.storage_path, 60 * 60 * 24 * 7);
        const sizeMb = (Number(file.size_bytes) / 1024 / 1024).toFixed(1);
        if (data?.signedUrl) {
          fileLinks.push(`[${file.original_name} (${sizeMb} MB)](${data.signedUrl})`);
        } else {
          fileLinks.push(`${file.original_name} (${sizeMb} MB)`);
        }
      }
    }

    const fields: Array<{ name: string; value: string; inline: boolean }> = [
      { name: "Descripció", value: description || "—", inline: false },
      { name: "Autor", value: authorAlias ?? authorEmail ?? authorId ?? "—", inline: true },
      { name: "Assignatura", value: subjectLabel ?? subjectId ?? "—", inline: true },
      { name: "Estat", value: status, inline: true },
    ];
    if (fileLinks.length > 0) {
      fields.push({ name: "Fitxers", value: fileLinks.join("\n"), inline: false });
    }

    // Thumbnail: first image attachment.
    const firstImage = files.find((f) => /\.(png|jpe?g|webp|gif)$/i.test(f.original_name));
    if (firstImage && supabase) {
      const { data } = await supabase.storage.from("contributions").createSignedUrl(firstImage.storage_path, 60 * 60 * 24 * 7);
      if (data?.signedUrl) {
        (embed as Record<string, unknown>).thumbnail = { url: data.signedUrl };
      }
    }

    embed = {
      title: "📄 Nova aportació enviada",
      description: `**${title}**`,
      color: CORAL,
      timestamp: createdAt ?? new Date().toISOString(),
      fields,
      footer: { text: "Fibers · Aportacions" },
    };
  } else {
    embed = {
      title: `🔔 ${type} a ${table}`,
      description: `\`\`\`json\n${JSON.stringify(record, null, 2).slice(0, 1000)}\n\`\`\``,
      color: CORAL,
      timestamp: new Date().toISOString(),
    };
  }

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(`Discord error: ${text}`, { status: res.status });
  }

  return new Response("ok", { status: 200 });
});
