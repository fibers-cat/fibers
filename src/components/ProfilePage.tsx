import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import Alert from "@mui/material/Alert";
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import ProfileHero from '@/components/ProfileHero';
import ProfileSignInPanel from '@/components/ProfileSignInPanel';
import ProfileStats from '@/components/ProfileStats';
import { hasSupabaseConfig } from "@/services/supabase";
import {
  getSession,
  getCurrentUser,
  onAuthStateChange,
  signInWithEmailLink,
  signInWithOAuth,
  signOut as signOutUser,
} from "@/services/auth";
import { fetchUserProfile, saveSocialAvatar, updateAlias } from "@/services/profiles";
import { fetchPendingContributionCount } from "@/services/contributions";
import { fetchContributorStanding, type ContributorStanding } from "@/services/contributors";
import { toSafeLocalPath } from "@/services/safeRedirect";
import { getSocialAvatar } from "@/services/socialAvatar";
import type { AppRole } from "@/services/roles";
import { localizePath, locales, useTranslations as createTranslator, type Locale } from "@/i18n";

type Props = { locale: Locale };

type AuthStatus = "loading" | "signedOut" | "signedIn" | "error";

const ROLE_LABEL_KEY: Record<AppRole, "profilePage.account.roleUser" | "profilePage.account.roleAdmin" | "profilePage.account.roleSuperadmin"> = {
  user: "profilePage.account.roleUser",
  admin: "profilePage.account.roleAdmin",
  superadmin: "profilePage.account.roleSuperadmin",
};

const PROVIDER_LABEL_KEY: Record<
  string,
  "profilePage.provider.email" | "profilePage.provider.google" | "profilePage.provider.github" | "profilePage.provider.other"
> = {
  email: "profilePage.provider.email",
  google: "profilePage.provider.google",
  github: "profilePage.provider.github",
};

export default function ProfilePage({ locale }: Props) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [authProvider, setAuthProvider] = useState("");
  const [alias, setAlias] = useState("");
  const [savedAlias, setSavedAlias] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [pendingError, setPendingError] = useState(false);
  const [standing, setStanding] = useState<ContributorStanding | null>(null);
  const [standingLoading, setStandingLoading] = useState(false);
  const [rankingError, setRankingError] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const currentUserId = useRef("");
  const initialLoadDone = useRef(false);
  const [safeReturn, setSafeReturn] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("returnTo");
    setSafeReturn(toSafeLocalPath(requested, window.location.origin));
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadToken intentionally retriggers the request when Retry is clicked.
  useEffect(() => {
    if (!hasSupabaseConfig) {
      setStatus("error");
      setMessage(t("profilePage.supabaseMissing"));
      setMessageIsError(true);
      return;
    }

    let active = true;

    const loadProfile = async () => {
      let session: Awaited<ReturnType<typeof getSession>>;
      try {
        session = await getSession();
      } catch (sessionError) {
        console.error("Could not load the current authentication session.", sessionError);
        if (!active) return;
        setMessage(t("profilePage.sessionError"));
        setMessageIsError(true);
        setStatus("error");
        return;
      }
      if (!active) return;

      currentUserId.current = session?.user?.id ?? "";

      if (!session) {
        setStatus("signedOut");
        setUserEmail("");
        setAuthProvider("");
        setAlias("");
        setSavedAlias("");
        setAvatarUrl(null);
        setRole(null);
        setPendingCount(null);
        setPendingError(false);
        setStanding(null);
        setStandingLoading(false);
        return;
      }

      let user: Awaited<ReturnType<typeof getCurrentUser>>;
      try {
        user = await getCurrentUser();
      } catch (userError) {
        console.error("Could not load the signed-in user.", userError);
        if (!active) return;
        setMessage(t("profilePage.sessionError"));
        setMessageIsError(true);
        setStatus("error");
        return;
      }
      if (!active) return;

      if (!user) {
        currentUserId.current = "";
        setStatus("signedOut");
        setUserEmail("");
        setAuthProvider("");
        return;
      }

      let profile: Awaited<ReturnType<typeof fetchUserProfile>>;
      try {
        profile = await fetchUserProfile(user.id);
      } catch (profileError) {
        console.error("Could not load the signed-in user's profile.", profileError);
        if (!active) return;
        setMessage(t("profilePage.profileError"));
        setMessageIsError(true);
        setStatus("error");
        return;
      }
      if (!active) return;

      const nextAlias = profile.alias ?? "";
      const socialAvatar = getSocialAvatar(user);
      currentUserId.current = user.id;
      setUserEmail(user.email ?? "");
      const provider =
        typeof user.app_metadata?.provider === "string"
          ? user.app_metadata.provider
          : user.identities?.[0]?.provider ?? "email";
      setAuthProvider(provider);
      setAlias(nextAlias);
      setSavedAlias(nextAlias);
      setAvatarUrl(socialAvatar ?? profile.avatarUrl ?? null);
      setRole(profile.role);
      setPendingCount(null);
      setPendingError(false);
      setStanding(null);
      setRankingError(false);
      setStatus("signedIn");
      setStandingLoading(true);

      if (socialAvatar && socialAvatar !== profile.avatarUrl) {
        try {
          await saveSocialAvatar(user.id, socialAvatar);
        } catch (avatarError) {
          console.error("Could not save the social profile avatar.", avatarError);
        }
      }

      const [pendingResult, standingResult] = await Promise.allSettled([
        fetchPendingContributionCount(user.id),
        nextAlias ? fetchContributorStanding(nextAlias) : Promise.resolve(null),
      ]);
      if (!active) return;

      if (pendingResult.status === "fulfilled") {
        setPendingCount(pendingResult.value);
      } else {
        console.error("Could not count the user's pending contributions.", pendingResult.reason);
        setPendingError(true);
      }

      if (standingResult.status === "fulfilled") {
        setStanding(standingResult.value);
      } else {
        console.error("Could not load the user's ranking position.", standingResult.reason);
        setRankingError(true);
      }
      setStandingLoading(false);
    };

    const load = async () => {
      setStatus("loading");
      setMessage("");
      setMessageIsError(false);
      try {
        await loadProfile();
      } finally {
        initialLoadDone.current = true;
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [reloadToken, t]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((_event, session) => {
      if (!initialLoadDone.current) return;
      const nextId = session?.user?.id ?? "";
      if (!currentUserId.current && !nextId) return;
      if (nextId === currentUserId.current) return;
      window.setTimeout(() => setReloadToken((value) => value + 1), 0);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (status !== "signedIn" || !safeReturn) return;

    const targetPath = toSafeLocalPath(safeReturn, window.location.origin);
    if (!targetPath) return;
    const target = new URL(targetPath, window.location.origin);

    const profilePaths = new Set(
      locales.map((item) =>
        new URL(localizePath("/perfil/", item), window.location.origin).pathname,
      ),
    );
    if (profilePaths.has(target.pathname)) return;

    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (`${target.pathname}${target.search}${target.hash}` === current) return;

    window.location.replace(target.href);
  }, [safeReturn, status]);

  const sendLink = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasSupabaseConfig) return;
    setBusy(true);
    setMessage("");
    setMessageIsError(false);
    const callback = new URL(localizePath("/perfil/", locale), window.location.origin);
    if (safeReturn) callback.searchParams.set("returnTo", safeReturn);
    try {
      await signInWithEmailLink(email, callback.href);
      setMessage(t("profilePage.linkSent"));
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profilePage.sessionError"));
      setMessageIsError(true);
    }
    setBusy(false);
  };

  const oauth = async (provider: "google" | "github") => {
    if (!hasSupabaseConfig) return;
    setBusy(true);
    setMessage("");
    setMessageIsError(false);
    const callback = new URL(localizePath("/perfil/", locale), window.location.origin);
    if (safeReturn) callback.searchParams.set("returnTo", safeReturn);
    try {
      await signInWithOAuth(provider, callback.href);
    } catch (error) {
      console.error(`Could not start ${provider} sign-in.`, error);
      setMessage(error instanceof Error ? error.message : t("profilePage.sessionError"));
      setMessageIsError(true);
      setBusy(false);
    }
  };

  const saveAlias = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasSupabaseConfig) return;
    const nextAlias = alias.trim();
    if (nextAlias.length < 2 || nextAlias.length > 40) {
      setMessage(t("profilePage.aliasInvalid"));
      setMessageIsError(true);
      return;
    }

    setBusy(true);
    setMessage("");
    setMessageIsError(false);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error(t("profilePage.sessionExpired"));
      await updateAlias(user.id, nextAlias);
      setAlias(nextAlias);
      setSavedAlias(nextAlias);
      setMessage(t("profilePage.aliasSaved"));
      setMessageIsError(false);
      setRankingError(false);
      try {
        setStanding(await fetchContributorStanding(nextAlias));
      } catch (standingError) {
        console.error("Could not refresh the user's ranking position.", standingError);
        setRankingError(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profilePage.sessionError"));
      setMessageIsError(true);
    }
    setBusy(false);
  };

  const signOut = async () => {
    if (!hasSupabaseConfig) return;
    setBusy(true);
    try {
      await signOutUser();
      currentUserId.current = "";
      setStatus("signedOut");
      setUserEmail("");
      setAuthProvider("");
      setAlias("");
      setSavedAlias("");
      setAvatarUrl(null);
      setRole(null);
      setPendingCount(null);
      setPendingError(false);
      setStanding(null);
      setStandingLoading(false);
      setMessage(t("profilePage.signedOut"));
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profilePage.sessionError"));
      setMessageIsError(true);
    }
    setBusy(false);
  };

  if (status === "loading") {
    return (
      <AppThemeProvider>
        <div className="profile-dashboard" aria-busy="true">
          <span className="profile-visually-hidden" role="status" aria-live="polite">
            {t("profilePage.loading")}
          </span>
          <section className="profile-hero">
            <Skeleton variant="circular" width={76} height={76} />
            <div className="profile-hero-body">
              <Skeleton variant="text" width={120} height={18} />
              <Skeleton variant="text" width={220} height={44} />
              <Skeleton variant="text" width={180} height={22} />
            </div>
            <Skeleton variant="rounded" width={148} height={38} />
          </section>
          <div className="profile-stats">
            {[0, 1, 2].map((item) => (
              <div className="profile-stat" key={item}>
                <Skeleton variant="rounded" width={44} height={44} />
                <div style={{ width: "100%" }}>
                  <Skeleton variant="text" width="60%" height={18} />
                  <Skeleton variant="text" width="35%" height={36} />
                  <Skeleton variant="text" width="75%" height={16} />
                </div>
              </div>
            ))}
          </div>
          <div className="profile-grid">
            <div className="profile-section">
              <Skeleton variant="text" width="45%" height={30} />
              <Skeleton variant="rounded" width="100%" height={74} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" width="100%" height={74} sx={{ mt: 1 }} />
            </div>
            <div className="profile-section">
              <Skeleton variant="text" width="55%" height={30} />
              <Skeleton variant="rounded" width="100%" height={56} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 1.5 }} />
            </div>
          </div>
        </div>
      </AppThemeProvider>
    );
  }

  if (status === "signedOut" || status === "error") {
    return (
      <AppThemeProvider>
        <ProfileSignInPanel
          locale={locale}
          errorState={status === 'error'}
          message={message}
          messageIsError={messageIsError}
          email={email}
          busy={busy}
          onEmailChange={setEmail}
          onRetry={() => setReloadToken((value) => value + 1)}
          onSubmit={sendLink}
          onOAuth={(provider) => void oauth(provider)}
        />
      </AppThemeProvider>
    );
  }

  const isAdmin = role === "admin" || role === "superadmin";
  const roleLabel = role ? t(ROLE_LABEL_KEY[role]) : "";
  const providerLabel = authProvider
    ? t(PROVIDER_LABEL_KEY[authProvider] ?? "profilePage.provider.other")
    : "";
  const published = standing ? standing.materialCount : null;
  const aliasChanged = alias.trim() !== savedAlias && alias.trim().length >= 2 && alias.trim().length <= 40;

  return (
    <AppThemeProvider>
      <div className="profile-dashboard">
        <ProfileHero
          avatarUrl={avatarUrl}
          avatarAlt={savedAlias ? t("profilePage.avatarAlt", { alias: savedAlias }) : t("profilePage.avatarAltFallback")}
          displayName={savedAlias || userEmail}
          email={userEmail}
          providerLabel={providerLabel}
          providerDescription={t("profilePage.provider.label")}
          role={role}
          roleLabel={roleLabel}
          signOutLabel={t("profilePage.signOut")}
          disabled={busy}
          onSignOut={() => void signOut()}
        />

        {message && (
          <Alert severity={messageIsError ? "error" : "success"} onClose={() => setMessage("")}>
            {message}
          </Alert>
        )}

        <ProfileStats
          publishedLabel={t("profilePage.stats.published")}
          publishedValue={standingLoading ? <Skeleton width={42} height={36} /> : published ?? "—"}
          publishedHint={t("profilePage.stats.publishedHint")}
          pendingLabel={t("profilePage.stats.pending")}
          pendingValue={pendingCount === null && !pendingError
            ? <Skeleton width={42} height={36} />
            : pendingError ? "—" : pendingCount}
          pendingHint={t("profilePage.stats.pendingHint")}
          rankingLabel={t("profilePage.stats.ranking")}
          rankingValue={standingLoading
            ? <Skeleton width={60} height={36} />
            : standing?.position ? `#${standing.position}` : t("profilePage.stats.rankingNone")}
          rankingHint={rankingError
            ? t("profilePage.rankingError")
            : standing?.position
              ? t("profilePage.stats.rankingHint", { total: standing.total })
              : t("profilePage.stats.rankingNoneHint")}
          {...(!rankingError && !standingLoading ? {
            rankingHref: localizePath("/col-laboradors/", locale),
            rankingLinkLabel: t("profilePage.stats.rankingLink"),
          } : {})}
        />

        <div className="profile-grid">
          <section className="profile-section">
            <h2>{t("profilePage.account.title")}</h2>
            <form className="profile-alias-form" onSubmit={saveAlias}>
              <TextField
                required
                fullWidth
                label={t("profilePage.account.aliasTitle")}
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                helperText={t("profilePage.account.aliasHelper")}
                slotProps={{ htmlInput: { minLength: 2, maxLength: 40 } }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={busy || !aliasChanged}
              >
                {t("profilePage.saveAlias")}
              </Button>
            </form>
          </section>

          <section className="profile-section profile-actions">
            <h2>{t("profilePage.actions.title")}</h2>
            <Stack spacing={1.25} className="profile-actions-list">
              <Button
                fullWidth
                variant="outlined"
                href={localizePath("/com-funciona/", locale)}
                startIcon={<InfoOutlined />}
              >
                {t("profilePage.actions.howItWorks")}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                href={localizePath("/aporta/", locale)}
                startIcon={<UploadFileRounded />}
              >
                {t("profilePage.actions.contribute")}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                href={localizePath("/assignatures/", locale)}
                startIcon={<MenuBookRounded />}
              >
                {t("profilePage.actions.browseSubjects")}
              </Button>
              {isAdmin && (
                <Button
                  fullWidth
                  variant="outlined"
                  href={localizePath("/admin/aportacions/", locale)}
                  startIcon={<AdminPanelSettingsOutlined />}
                >
                  {t("profilePage.actions.adminContributions")}
                </Button>
              )}
              {role === "superadmin" && (
                <Button
                  fullWidth
                  variant="outlined"
                  href={localizePath("/admin/usuaris/", locale)}
                  startIcon={<AdminPanelSettingsOutlined />}
                >
                  {t("profilePage.actions.adminUsers")}
                </Button>
              )}
            </Stack>
          </section>
        </div>
      </div>
    </AppThemeProvider>
  );
}
