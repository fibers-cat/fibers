import { useEffect, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AttachFileRounded from "@mui/icons-material/AttachFileRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import { ThemeProvider } from "@mui/material/styles";
import { supabase, type Subject } from "@/lib/supabase";
import { fibersTheme } from "@/components/theme";

type Props = { initialSubject?: string };
const maxFileSize = 50 * 1024 * 1024;

export default function ContributionForm({ initialSubject = "" }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileSizeError, setFileSizeError] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase
        .from("subjects")
        .select(
          "id,slug,acronym,code,name,category,description,languages,specialty,is_current",
        )
        .order("acronym"),
      supabase.auth.getSession(),
    ]).then(([subjectResult, userResult]) => {
      setSubjects((subjectResult.data ?? []) as Subject[]);
      setUserId(userResult.data.session?.user.id ?? null);
      setAuthLoaded(true);
      if (userResult.error) {
        console.error("Could not load the authentication session for contributions.", userResult.error);
        setAuthError(true);
      }
      const selected = subjectResult.data?.find(
        (item) => item.acronym === initialSubject,
      );
      if (selected) setSubjectId(selected.id);
    }).catch((error: unknown) => {
      console.error("Could not initialize the contribution form.", error);
      setAuthLoaded(true);
      setAuthError(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthLoaded(true);
      setAuthError(false);
    });
    return () => data.subscription.unsubscribe();
  }, [initialSubject]);

  const needsLogin = Boolean(supabase && authLoaded && !authError && !userId);
  const fieldErrors = {
    subject: !subjectId ? "Selecciona una assignatura." : "",
    title:
      title.trim().length < 3
        ? "El títol és obligatori i ha de tenir almenys 3 caràcters."
        : title.trim().length > 120
          ? "El títol no pot superar els 120 caràcters."
          : "",
    description:
      description.trim().length < 10
        ? "La descripció és obligatòria i ha de tenir almenys 10 caràcters."
        : description.trim().length > 3000
          ? "La descripció no pot superar els 3000 caràcters."
          : "",
    files: fileSizeError ? "Cada fitxer ha de pesar com a màxim 50 MB." : "",
    acknowledgement: acknowledged
      ? ""
      : "Confirma que tens dret a compartir aquest material.",
  };
  const validationIssues = [
    !supabase && "No s’ha pogut connectar amb el servei d’aportacions.",
    supabase && !authLoaded && "Espera que es comprovi la sessió abans d’enviar.",
    authError && "No s’ha pogut comprovar la sessió. Torna-ho a provar més tard.",
    fieldErrors.subject,
    fieldErrors.title,
    fieldErrors.description,
    fieldErrors.files,
    fieldErrors.acknowledgement,
  ].filter((issue): issue is string => Boolean(issue));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidationErrors(true);
    if (validationIssues.length > 0 || !supabase || !userId) return;
    setBusy(true);
    setMessage("");
    try {
      const { data: contribution, error } = await supabase
        .from("contributions")
        .insert({
          author_id: userId,
          subject_id: subjectId,
          title: title.trim(),
          description: description.trim(),
        })
        .select("id")
        .single();
      if (error) throw error;

      for (const file of files) {
        const path = `${userId}/${contribution.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const uploaded = await supabase.storage
          .from("contributions")
          .upload(path, file, {
            contentType: file.type || "application/octet-stream",
          });
        if (uploaded.error) throw uploaded.error;
        const registered = await supabase.from("contribution_files").insert({
          contribution_id: contribution.id,
          storage_path: path,
          original_name: file.name,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        });
        if (registered.error) throw registered.error;
      }
      setMessage(
        "Aportació enviada. Les aportacions i els fitxers queden pendents de revisió. Es publicaran quan s’aprovin.",
      );
      setFiles([]);
      setTitle("");
      setDescription("");
      setAcknowledged(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `No s’ha pogut enviar: ${error.message}`
          : "No s’ha pogut enviar l’aportació.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemeProvider theme={fibersTheme}>
      <Stack
        component="form"
        spacing={2.5}
        className="contribution-form"
        onSubmit={submit}
        noValidate
        useFlexGap
      >
        {!supabase && (
          <Typography className="contribution-status contribution-status--error" role="status">
            Falta configurar la connexió amb Supabase.
          </Typography>
        )}
        {message && (
          <Typography
            className={`contribution-status ${
              message.startsWith("Aportació enviada")
                ? "contribution-status--success"
                : "contribution-status--error"
            }`}
            role="status"
          >
            {message}
          </Typography>
        )}
        <TextField
          select
          required
          label="Assignatura"
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          error={showValidationErrors && Boolean(fieldErrors.subject)}
          helperText={showValidationErrors ? fieldErrors.subject : ""}
          slotProps={{
            input: {
              endAdornment: showValidationErrors && fieldErrors.subject ? (
                <InputAdornment position="end">
                  <ErrorOutlineRounded color="error" fontSize="small" aria-hidden="true" />
                </InputAdornment>
              ) : undefined,
            },
          }}
          fullWidth
        >
          <MenuItem value="">Selecciona una assignatura</MenuItem>
          {subjects.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.acronym}
              {item.code ? ` (${item.code})` : ""} — {item.name}
              {item.is_current ? "" : " · Assignatura no vigent"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          required
          label="Títol del material"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={showValidationErrors && Boolean(fieldErrors.title)}
          helperText={showValidationErrors ? fieldErrors.title : ""}
          slotProps={{
            htmlInput: { maxLength: 120 },
            input: {
              endAdornment: showValidationErrors && fieldErrors.title ? (
                <InputAdornment position="end">
                  <ErrorOutlineRounded color="error" fontSize="small" aria-hidden="true" />
                </InputAdornment>
              ) : undefined,
            },
          }}
          fullWidth
        />
        <TextField
          required
          label="Descripció"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          multiline
          minRows={4}
          error={showValidationErrors && Boolean(fieldErrors.description)}
          helperText={showValidationErrors ? fieldErrors.description : ""}
          slotProps={{
            htmlInput: { maxLength: 3000 },
            input: {
              endAdornment:
                showValidationErrors && fieldErrors.description ? (
                  <InputAdornment
                    position="end"
                    sx={{ alignSelf: "flex-start" }}
                  >
                    <ErrorOutlineRounded color="error" fontSize="small" aria-hidden="true" />
                  </InputAdornment>
                ) : undefined,
            },
          }}
          fullWidth
        />
        <Button
          className={`file-picker ${showValidationErrors && fieldErrors.files ? "file-picker--error" : ""}`}
          component="label"
          variant="outlined"
          startIcon={<AttachFileRounded />}
        >
          Adjunta arxius
          <input
            hidden
            type="file"
            multiple
            accept=".pdf,.txt,.c,.cpp,.png,.jpg,.jpeg,.webp,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              if (selected.some((file) => file.size > maxFileSize)) {
                setFileSizeError(true);
                return;
              }
              setFileSizeError(false);
              setFiles(selected);
            }}
          />
        </Button>
        {showValidationErrors && fieldErrors.files && (
          <FormHelperText error className="contribution-field-error">
            {fieldErrors.files}
          </FormHelperText>
        )}
        {files.length > 0 && (
          <Typography className="file-list">
            {files.map((file) => file.name).join(" · ")}
          </Typography>
        )}
        <Stack spacing={0.5} useFlexGap className="contribution-checkbox-group">
          <FormControlLabel
            control={
              <Checkbox
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                color={
                  showValidationErrors && fieldErrors.acknowledgement
                    ? "error"
                    : "primary"
                }
              />
            }
            label={
              <span>
                Confirmo que tinc dret a compartir aquest material i que no inclou
                contingut protegit.
              </span>
            }
          />
          {showValidationErrors && fieldErrors.acknowledgement && (
            <FormHelperText error className="contribution-field-error">
              {fieldErrors.acknowledgement}
            </FormHelperText>
          )}
        </Stack>
        {showValidationErrors && (needsLogin || authError || (supabase && !authLoaded)) && (
          <Alert severity="error">
            {needsLogin && (
              <p className="contribution-login-issue">
                Has d’iniciar sessió per enviar l’aportació.{" "}
                <a href={`/perfil/?returnTo=${encodeURIComponent("/aporta/")}`}>
                  Inicia sessió
                </a>
              </p>
            )}
            {authError && (
              <p className="contribution-login-issue">
                No s’ha pogut comprovar la sessió. Torna-ho a provar més tard.
              </p>
            )}
            {supabase && !authLoaded && (
              <p className="contribution-login-issue">
                Espera que es comprovi la sessió abans d’enviar.
              </p>
            )}
          </Alert>
        )}
        <Button
          className="primary-action-button"
          type="submit"
          variant="contained"
          disabled={busy}
          endIcon={<ArrowForwardRounded />}
        >
          {busy ? "Enviant…" : "Enviar per revisió"}
        </Button>
      </Stack>
    </ThemeProvider>
  );
}
