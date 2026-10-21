import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import Alert from "@mui/material/Alert";
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import GitHub from "@mui/icons-material/GitHub";
import HourglassEmptyRounded from "@mui/icons-material/HourglassEmptyRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
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
import { localizePath, locales, useTranslations, type Locale } from "@/i18n";

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
  const t = useMemo(() => useTranslations(locale), [locale]);
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

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setStatus("error");
      setMessage(t("profilePage.supabaseMissing"));
      setMessageIsError(true);
      return;
    }

    let active = true;

    const loadProfile = async () => {
      let session;
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

      let user;
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

      let profile;
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
  }, [locale, reloadToken, t]);

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
        <div className="profile-signin">
          {message && (
            <Alert severity={messageIsError ? "error" : "info"} sx={{ mb: 2 }}>{message}</Alert>
          )}
          {status === "error" && (
            <Stack spacing={2} sx={{ mb: 2 }}>
              {!message && <Alert severity="error">{t("profilePage.profileError")}</Alert>}
              <Button
                variant="outlined"
                sx={{ alignSelf: "flex-start" }}
                onClick={() => setReloadToken((value) => value + 1)}
              >
                {t("profilePage.retry")}
              </Button>
            </Stack>
          )}
          <Stack spacing={2.5}>
            <div>
              <Typography component="h2" variant="h5">{t("profilePage.signedOutHeading")}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {t("profilePage.signInLead")}
              </Typography>
            </div>
            <Stack component="form" spacing={2} onSubmit={sendLink}>
              <TextField
                required
                type="email"
                label={t("contactForm.email")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button
                className="primary-action-button"
                type="submit"
                variant="contained"
                disabled={busy}
                endIcon={<ArrowForwardRounded />}
              >
                {t("profilePage.sendLink")}
              </Button>
            </Stack>
            <Divider sx={{ color: "text.secondary", fontSize: "1rem" }}>
              {t("profilePage.orContinueWith")}
            </Divider>
            <Button
              fullWidth
              disabled={busy}
              variant="outlined"
              onClick={() => void oauth("google")}
              startIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  style={{ display: "block", width: 18, height: 18 }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              }
              sx={{
                minHeight: 40,
                borderColor: "#d0d5dd",
                borderRadius: "50px",
                bgcolor: "#fff",
                color: "#1f1f1f",
                fontFamily: '"Roboto Variable", Roboto, Arial, sans-serif',
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: "0.25px",
                textTransform: "none",
                "&:hover": { bgcolor: "#f6f7f9", borderColor: "#b8bec8" },
              }}
            >
              {t("profilePage.google")}
            </Button>
            <Button
              fullWidth
              disabled={busy}
              variant="outlined"
              onClick={() => void oauth("github")}
              startIcon={<GitHub />}
              sx={{
                minHeight: 40,
                borderColor: "#d0d5dd",
                borderRadius: "50px",
                bgcolor: "#fff",
                color: "text.primary",
                "&:hover": {
                  borderColor: "#b8bec8",
                  bgcolor: "#f6f7f9",
                },
              }}
            >
              {t("profilePage.github")}
            </Button>
          </Stack>
        </div>
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
        <section className="profile-hero">
          <Avatar
            src={avatarUrl ?? undefined}
            alt={savedAlias ? t("profilePage.avatarAlt", { alias: savedAlias }) : t("profilePage.avatarAltFallback")}
            sx={{ width: 76, height: 76, bgcolor: "grey.100", color: "text.secondary", border: "1px solid #e6e8ec" }}
          >
            <PersonOutlineRounded fontSize="large" />
          </Avatar>
          <div className="profile-hero-body">
            <h2 className="profile-hero-name">{savedAlias || userEmail}</h2>
            <p className="profile-hero-meta">
              {userEmail}
              {providerLabel && (
                <span
                  className="profile-provider"
                  title={t("profilePage.provider.label")}
                  aria-label={`${t("profilePage.provider.label")}: ${providerLabel}`}
                >
                  {providerLabel}
                </span>
              )}
              {role && <span className={`profile-role profile-role--${role}`}>{roleLabel}</span>}
            </p>
          </div>
          <Button
            variant="outlined"
            className="profile-signout"
            onClick={() => void signOut()}
            disabled={busy}
            startIcon={<LogoutRounded />}
          >
            {t("profilePage.signOut")}
          </Button>
        </section>

        {message && (
          <Alert severity={messageIsError ? "error" : "success"} onClose={() => setMessage("")}>
            {message}
          </Alert>
        )}

        <section className="profile-stats">
          <article className="profile-stat">
            <span className="profile-stat-icon profile-stat-icon--coral"><DescriptionOutlined /></span>
            <div>
              <span className="profile-stat-label">{t("profilePage.stats.published")}</span>
              <strong className="profile-stat-value">
                {standingLoading ? <Skeleton width={42} height={36} /> : published ?? "—"}
              </strong>
              <span className="profile-stat-hint">{t("profilePage.stats.publishedHint")}</span>
            </div>
          </article>
          <article className="profile-stat">
            <span className="profile-stat-icon profile-stat-icon--amber"><HourglassEmptyRounded /></span>
            <div>
              <span className="profile-stat-label">{t("profilePage.stats.pending")}</span>
              <strong className="profile-stat-value">
                {pendingCount === null && !pendingError
                  ? <Skeleton width={42} height={36} />
                  : pendingError
                    ? "—"
                    : pendingCount}
              </strong>
              <span className="profile-stat-hint">{t("profilePage.stats.pendingHint")}</span>
            </div>
          </article>
          <article className="profile-stat">
            <span className="profile-stat-icon profile-stat-icon--teal"><EmojiEventsOutlined /></span>
            <div>
              <span className="profile-stat-label">{t("profilePage.stats.ranking")}</span>
              <strong className="profile-stat-value">
                {standingLoading
                  ? <Skeleton width={60} height={36} />
                  : standing?.position
                    ? `#${standing.position}`
                    : t("profilePage.stats.rankingNone")}
              </strong>
              <span className="profile-stat-hint">
                {rankingError
                  ? t("profilePage.rankingError")
                  : standing?.position
                    ? t("profilePage.stats.rankingHint", { total: standing.total })
                    : t("profilePage.stats.rankingNoneHint")}
              </span>
              {!rankingError && !standingLoading && (
                <a className="profile-stat-link" href={localizePath("/col-laboradors/", locale)}>
                  {t("profilePage.stats.rankingLink")}
                </a>
              )}
            </div>
          </article>
        </section>

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
