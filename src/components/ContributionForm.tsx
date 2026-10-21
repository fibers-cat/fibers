import { useEffect, useState, type SyntheticEvent } from "react";
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
import { hasSupabaseConfig, type Subject } from "@/services/supabase";
import { getSession } from "@/services/auth";
import { listSubjectsForContribution, submitContribution } from "@/services/contributions";
import { fibersTheme } from "@/components/shared/theme";
import { localizePath, useTranslations, type Locale } from "@/i18n";

type Props = { initialSubject?: string; locale: Locale };
const maxFileSize = 50 * 1024 * 1024;

export default function ContributionForm({ initialSubject = "", locale }: Props) {
  const t = useTranslations(locale);
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
    if (!hasSupabaseConfig) return;
    Promise.all([
      listSubjectsForContribution(),
      getSession(),
    ]).then(([subjects, session]) => {
      setSubjects(subjects);
      setUserId(session?.user.id ?? null);
      setAuthLoaded(true);
      const selected = subjects.find(
        (item) => item.acronym === initialSubject,
      );
      if (selected) setSubjectId(selected.id);
    }).catch((error: unknown) => {
      console.error("Could not initialize the contribution form.", error);
      setAuthLoaded(true);
      setAuthError(true);
    });
  }, [initialSubject]);

  const needsLogin = Boolean(hasSupabaseConfig && authLoaded && !authError && !userId);
  const fieldErrors = {
    subject: !subjectId ? t("contributionForm.errors.subject") : "",
    title:
      title.trim().length < 3
        ? t("contributionForm.errors.titleShort")
        : title.trim().length > 120
          ? t("contributionForm.errors.titleLong")
          : "",
    description:
      description.trim().length < 10
        ? t("contributionForm.errors.descriptionShort")
        : description.trim().length > 3000
          ? t("contributionForm.errors.descriptionLong")
          : "",
    files: fileSizeError ? t("contributionForm.errors.filesTooLarge") : "",
    acknowledgement: acknowledged
      ? ""
      : t("contributionForm.errors.acknowledgement"),
  };
  const validationIssues = [
    !hasSupabaseConfig && t("contributionForm.serviceUnavailable"),
    hasSupabaseConfig && !authLoaded && t("contributionForm.sessionChecking"),
    authError && t("contributionForm.sessionError"),
    fieldErrors.subject,
    fieldErrors.title,
    fieldErrors.description,
    fieldErrors.files,
    fieldErrors.acknowledgement,
  ].filter((issue): issue is string => Boolean(issue));

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidationErrors(true);
    if (validationIssues.length > 0 || !hasSupabaseConfig || !userId) return;
    setBusy(true);
    setMessage("");
    try {
      await submitContribution({
        authorId: userId,
        subjectId,
        title: title.trim(),
        description: description.trim(),
        files,
      });
      setMessage(t("contributionForm.success"));
      setFiles([]);
      setTitle("");
      setDescription("");
      setAcknowledged(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? t("contributionForm.errorPrefix", { message: error.message })
          : t("contributionForm.error"),
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
        {!hasSupabaseConfig && (
          <Typography className="contribution-status contribution-status--error" role="status">
            {t("contributionForm.supabaseMissing")}
          </Typography>
        )}
        {message && (
          <Typography
            className={`contribution-status ${
              message.startsWith(t("contributionForm.success"))
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
          label={t("contributionForm.subjectLabel")}
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
          <MenuItem value="">{t("contributionForm.subjectPlaceholder")}</MenuItem>
          {subjects.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.acronym}
              {item.code ? ` (${item.code})` : ""} — {item.name}
              {item.is_current ? "" : t("contributionForm.subjectLatest")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          required
          label={t("contributionForm.titleLabel")}
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
          label={t("contributionForm.descriptionLabel")}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={showValidationErrors && Boolean(fieldErrors.description)}
          helperText={showValidationErrors ? fieldErrors.description : ""}
          multiline
          minRows={5}
          slotProps={{
            htmlInput: { maxLength: 3000 },
            input: {
              endAdornment: showValidationErrors && fieldErrors.description ? (
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
          {t("contributionForm.attachFiles")}
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
        <Typography className="file-list">
          {files.map((file) => file.name).join(", ")}
        </Typography>
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
              <span>{t("contributionForm.acknowledgement")}</span>
            }
          />
          {showValidationErrors && fieldErrors.acknowledgement && (
            <FormHelperText error className="contribution-field-error">
              {fieldErrors.acknowledgement}
            </FormHelperText>
          )}
        </Stack>
        {showValidationErrors && (needsLogin || authError || (hasSupabaseConfig && !authLoaded)) && (
          <Alert severity="error">
            {needsLogin && (
              <p className="contribution-login-issue">
                {t("contributionForm.loginRequired")}{" "}
                <a href={localizePath(`/perfil/?returnTo=${encodeURIComponent('/aporta/')}`, locale)}>
                  {t("contributionForm.signIn")}
                </a>
              </p>
            )}
            {authError && (
              <p className="contribution-login-issue">
                {t("contributionForm.sessionError")}
              </p>
            )}
            {hasSupabaseConfig && !authLoaded && (
              <p className="contribution-login-issue">
                {t("contributionForm.sessionChecking")}
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
          {busy ? t("contributionForm.sending") : t("contributionForm.submit")}
        </Button>
      </Stack>
    </ThemeProvider>
  );
}
