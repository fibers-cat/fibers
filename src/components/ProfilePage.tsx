import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import GitHub from "@mui/icons-material/GitHub";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import { ThemeProvider } from "@mui/material/styles";
import { supabase } from "@/lib/supabase";
import { getSocialAvatar } from "@/lib/socialAvatar";
import { fibersTheme } from "@/components/theme";

type Props = { returnTo: string };

export default function ProfilePage({ returnTo }: Props) {
  const [email, setEmail] = useState("");
  const [alias, setAlias] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const load = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        console.error("Could not load the current authentication session.", sessionError);
        setMessage("No s’ha pogut carregar la sessió.");
        setMessageIsError(true);
        return;
      }
      if (!session) {
        setUserEmail("");
        setAlias("");
        setAvatarUrl(null);
        setMessage("");
        setMessageIsError(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (!active) return;
      if (userError) {
        console.error("Could not load the signed-in user.", userError);
        setMessage("No s’ha pogut carregar la sessió.");
        setMessageIsError(true);
        return;
      }
      setUserEmail(user?.email ?? "");
      if (!user) {
        setAlias("");
        setAvatarUrl(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("alias,avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError) {
        console.error("Could not load the signed-in user's profile.", profileError);
        setMessage("No s’ha pogut carregar el perfil.");
        setMessageIsError(true);
        return;
      }

      setAlias(profile?.alias ?? "");
      const socialAvatar = getSocialAvatar(user);
      setAvatarUrl(socialAvatar ?? profile?.avatar_url ?? null);
      if (socialAvatar && socialAvatar !== profile?.avatar_url) {
        const { error: avatarError } = await supabase
          .from("profiles")
          .update({ avatar_url: socialAvatar })
          .eq("id", user.id);
        if (avatarError) {
          console.error("Could not save the social profile avatar.", avatarError);
          if (active) {
            setMessage("No s’ha pogut desar la imatge de perfil.");
            setMessageIsError(true);
          }
        }
      }
    };
    void load();
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        void load();
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const sendLink = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    setMessageIsError(false);
    const callback = new URL("/perfil/", window.location.origin);
    callback.searchParams.set("returnTo", safeReturn);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.href },
    });
    setMessage(
      error ? error.message : "T’hem enviat un enllaç per iniciar sessió.",
    );
    setMessageIsError(Boolean(error));
    setBusy(false);
  };

  const oauth = async (provider: "google" | "github") => {
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    setMessageIsError(false);
    const callback = new URL("/perfil/", window.location.origin);
    callback.searchParams.set("returnTo", safeReturn);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.href },
    });
    if (error) {
      console.error(`Could not start ${provider} sign-in.`, error);
      setMessage(error.message);
      setMessageIsError(true);
      setBusy(false);
    }
  };

  const saveAlias = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    setMessageIsError(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = user
      ? await supabase
          .from("profiles")
          .update({ alias: alias.trim(), updated_at: new Date().toISOString() })
          .eq("id", user.id)
      : { error: new Error("Sessió caducada") };
    setMessage(error ? error.message : "Àlies desat.");
    setMessageIsError(Boolean(error));
    setBusy(false);
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUserEmail("");
      setAlias("");
      setAvatarUrl(null);
      setMessage("Has tancat la sessió.");
      setMessageIsError(false);
    }
  };
  const safeReturn =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  return (
    <ThemeProvider theme={fibersTheme}>
      <Stack spacing={2.5} className="profile-card">
        <Typography component="h2" variant="h5">
          {userEmail ? "El teu perfil" : "Inicia sessió"}
        </Typography>
        {message && (
          <Alert severity={messageIsError ? "error" : "info"}>{message}</Alert>
        )}
        {!supabase && (
          <Alert severity="error">Falta configurar Supabase.</Alert>
        )}
        {userEmail ? (
          <>
            <Avatar
              src={avatarUrl ?? undefined}
              alt={alias ? `Imatge de perfil de ${alias}` : "Imatge de perfil"}
              sx={{ width: 72, height: 72, bgcolor: "grey.100", color: "text.secondary" }}
            >
              <PersonOutlineRounded fontSize="large" />
            </Avatar>
            <Typography>Has iniciat sessió amb {userEmail}.</Typography>
            <Stack component="form" spacing={2} onSubmit={saveAlias}>
              <TextField
                required
                label="Àlies o pseudònim públic"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                inputProps={{ minLength: 2, maxLength: 40 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={busy || alias.trim().length < 2}
              >
                Desa l’àlies
              </Button>
            </Stack>
            <Button href={safeReturn} variant="outlined">
              Continua
            </Button>
            <Button onClick={signOut}>Tanca la sessió</Button>
          </>
        ) : (
          <>
            <Typography>
              Entra amb un enllaç al correu o amb un compte social.
            </Typography>
            <Stack component="form" spacing={2} onSubmit={sendLink}>
              <TextField
                required
                type="email"
                label="Correu electrònic"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button
                className="profile-email-submit"
                type="submit"
                variant="contained"
                disabled={busy}
                sx={{
                  minHeight: 40,
                  borderRadius: "50px",
                }}
              >
                Envia’m un enllaç
              </Button>
            </Stack>
            <Divider sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
              o continua amb
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
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "0.25px",
                textTransform: "none",
                "&:hover": { bgcolor: "#f6f7f9", borderColor: "#b8bec8" },
              }}
            >
              Inicia la sessió amb Google
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
              Inicia la sessió amb Github
            </Button>
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}
