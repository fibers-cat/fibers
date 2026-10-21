import { supabase } from '@/services/supabase';

/** Storage bucket that holds the approved contribution files. */
export const CONTRIBUTIONS_BUCKET = 'contributions';

/** Default lifetime for signed download URLs, in seconds (one hour). */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function client() {
  if (!supabase) {
    throw new Error(
      'Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per accedir als fitxers.',
    );
  }
  return supabase;
}

/** Creates a temporary signed URL for a private file in the contributions bucket. */
export async function createSignedFileUrl(
  storagePath: string,
  expiresInSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const { data, error } = await client().storage
    .from(CONTRIBUTIONS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/** Uploads a file to the contributions bucket and returns its storage path. */
export async function uploadContributionFile(storagePath: string, file: File): Promise<void> {
  const { error } = await client().storage
    .from(CONTRIBUTIONS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
    });
  if (error) throw error;
}
