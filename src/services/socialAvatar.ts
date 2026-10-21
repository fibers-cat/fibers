import type { User } from "@supabase/supabase-js";

export function getSocialAvatar(user: User): string | null {
  const identity =
    user.identities?.find(
      (item) => item.provider === user.app_metadata.provider,
    ) ??
    user.identities?.find((item) =>
      ["google", "github"].includes(item.provider),
    );
  const provider = identity?.provider ?? user.app_metadata.provider;
  const identityData = identity?.identity_data ?? {};
  const metadata = user.user_metadata;
  const candidate =
    provider === "google"
      ? (identityData.picture ?? metadata.picture)
      : provider === "github"
        ? (identityData.avatar_url ?? metadata.avatar_url)
        : null;

  if (typeof candidate !== "string") return null;

  try {
    const url = new URL(candidate);
    const trustedHost =
      url.hostname === "avatars.githubusercontent.com" ||
      /^lh[0-9]+\.googleusercontent\.com$/.test(url.hostname);
    return url.protocol === "https:" && trustedHost ? url.href : null;
  } catch {
    return null;
  }
}
