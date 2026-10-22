import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AttachFileRounded from "@mui/icons-material/AttachFileRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { hasSupabaseConfig, type Subject } from "@/services/supabase";
import { getSession, onAuthStateChange } from "@/services/auth";
import { listSubjectsForContribution, submitContribution } from "@/services/contributions";
import { fetchUserProfile } from "@/services/profiles";
import { formatFileSize } from "@/data/materials";
import { getDictionary, localizePath, useTranslations, type Locale } from "@/i18n";

type Props = { initialSubject?: string; locale: Locale };
const maxFileSize = 50 * 1024 * 1024;

/**
 * The form is only reachable with an active session: the visitor signs in
 * first and the form opens empty, so nothing typed can be lost on the way.
 */
type AuthPhase = "loading" | "signedOut" | "signedIn" | "unavailable" | "error";

/** Short uppercase tag with the extension of a file name. */
function fileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  if (index <= 0 || index === name.length - 1) return "FILE";
  return name.slice(index + 1).toUpperCase().slice(0, 4);
}

/** Label of a subject inside the searchable select. */
function subjectOptionLabel(subject: Subject): string {
  return `${subject.acronym}${subject.code ? ` (${subject.code})` : ""} — ${subject.name}`;
}

/**
 * Filters the subjects: acronym and code matches come first, then matches on
 * the subject name.
 */
function filterSubjects(
  options: Subject[],
  state: { inputValue: string },
): Subject[] {
  const query = state.inputValue.trim().toLowerCase();
  if (!query) return options;
  const exact: Subject[] = [];
  const loose: Subject[] = [];
  for (const option of options) {
    const acronym = option.acronym.toLowerCase();
    const code = option.code?.toLowerCase() ?? "";
    const name = option.name.toLowerCase();
    if (acronym.startsWith(query) || code.startsWith(query)) exact.push(option);
    else if (
      acronym.includes(query) ||
      code.includes(query) ||
      name.includes(query)
    ) {
      loose.push(option);
    }
  }
  return [...exact, ...loose];
}

export default function ContributionForm({ initialSubject = "", locale }: Props) {
  const t = useTranslations(locale);
  const gate = getDictionary(locale).contributionForm.gate;

  const [phase, setPhase] = useState<AuthPhase>("loading");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsError, setSubjectsError] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [identity, setIdentity] = useState("");
  const [sessionLost, setSessionLost] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileSizeError, setFileSizeError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const lastUserId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectsLoaded = useRef(false);
  /** Subject requested through the query string, read on the client. */
  const requestedSubject = useRef(initialSubject);
  const [subjectParam, setSubjectParam] = useState(initialSubject);

  /** The site is prerendered, so the query string is only known in the browser. */
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("assignatura") ?? "";
    if (!fromUrl || fromUrl === requestedSubject.current) return;
    requestedSubject.current = fromUrl;
    setSubjectParam(fromUrl);
  }, []);

  /** Where the visitor lands after signing in: back here, subject included. */
  const returnPath = subjectParam
    ? `${localizePath("/aporta/", locale)}?assignatura=${encodeURIComponent(subjectParam)}`
    : localizePath("/aporta/", locale);
  const signInHref = `${localizePath("/perfil/", locale)}?returnTo=${encodeURIComponent(returnPath)}`;

  const loadSubjects = useCallback(async () => {
    if (subjectsLoaded.current) return;
    setSubjectsLoading(true);
    try {
      const list = await listSubjectsForContribution();
      subjectsLoaded.current = true;
      setSubjects(list);
      setSubjectsError(false);
      const selected = list.find(
        (item) => item.acronym === requestedSubject.current,
      );
      if (selected) setSubjectId(selected.id);
    } catch (error) {
      console.error("Could not load the subjects of the contribution form.", error);
      setSubjectsError(true);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  const loadIdentity = useCallback(async (id: string, fallback: string) => {
    try {
      const profile = await fetchUserProfile(id);
      setIdentity(profile.alias ?? fallback);
    } catch (error) {
      console.error("Could not load the profile of the signed-in user.", error);
      setIdentity(fallback);
    }
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setPhase("unavailable");
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const session = await getSession();
        if (!active) return;
        if (!session) {
          setPhase("signedOut");
          return;
        }
        lastUserId.current = session.user.id;
        setUserId(session.user.id);
        setIdentity(session.user.email ?? "");
        setPhase("signedIn");
        void loadSubjects();
        void loadIdentity(session.user.id, session.user.email ?? "");
      } catch (error) {
        console.error("Could not initialize the contribution form.", error);
        if (!active) return;
        setPhase("error");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [loadSubjects, loadIdentity]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((_event, session) => {
      const nextId = session?.user.id ?? null;
      const hadSession = Boolean(lastUserId.current);
      lastUserId.current = nextId;
      if (nextId) {
        setUserId(nextId);
        setSessionLost(false);
        setPhase((current) => (current === "signedOut" ? "signedIn" : current));
        if (!hadSession) {
          void loadSubjects();
          void loadIdentity(nextId, session?.user.email ?? "");
        }
        return;
      }
      if (hadSession) {
        // The form stays on screen with its content: the visitor only has to
        // sign in again to send the contribution.
        setUserId(null);
        setSessionLost(true);
      }
    });
    return unsubscribe;
  }, [loadSubjects, loadIdentity]);

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  /** Validates and stores a batch of files coming from the picker or a drop. */
  const acceptFiles = (selected: File[]) => {
    if (selected.length === 0) return;
    if (selected.some((file) => file.size > maxFileSize)) {
      setFileSizeError(true);
      return;
    }
    setFileSizeError(false);
    setFiles(selected);
    const input = fileInputRef.current;
    if (input) {
      const transfer = new DataTransfer();
      selected.forEach((file) => transfer.items.add(file));
      input.files = transfer.files;
    }
  };
  const selectedSubject = useMemo(
    () => subjects.find((item) => item.id === subjectId) ?? null,
    [subjects, subjectId],
  );
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
    files:
      fileSizeError
        ? t("contributionForm.errors.filesTooLarge")
        : files.length === 0
          ? t("contributionForm.errors.filesRequired")
          : "",
    acknowledgement: acknowledged
      ? ""
      : t("contributionForm.errors.acknowledgement"),
  };
  const validationIssues = [
    fieldErrors.subject,
    fieldErrors.title,
    fieldErrors.description,
    fieldErrors.files,
    fieldErrors.acknowledgement,
  ].filter((issue): issue is string => Boolean(issue));

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidationErrors(true);
    if (!userId) {
      setSessionLost(true);
      return;
    }
    if (validationIssues.length > 0) return;
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

  if (phase === "unavailable") {
    return (
      <AppThemeProvider>
        <Alert severity="error">{t("contributionForm.supabaseMissing")}</Alert>
      </AppThemeProvider>
    );
  }

  if (phase === "loading") {
    return (
      <AppThemeProvider>
        <Stack spacing={2.5} className="contribution-form" aria-busy="true">
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={110} />
          <Skeleton variant="rounded" height={78} />
          <span className="contribution-visually-hidden" role="status">
            {t("contributionForm.sessionChecking")}
          </span>
        </Stack>
      </AppThemeProvider>
    );
  }

  if (phase === "signedOut" || phase === "error") {
    return (
      <AppThemeProvider>
        <Stack spacing={2}>
          {phase === "error" && (
            <Alert severity="warning">{t("contributionForm.sessionError")}</Alert>
          )}
          <div className="contribution-gate">
            <span className="contribution-gate-icon" aria-hidden="true">
              <LockOutlined />
            </span>
            <h3 className="contribution-gate-title">{gate.title}</h3>
            <p className="contribution-gate-text">{gate.text}</p>
            <Button
              className="primary-action-button contribution-gate-action"
              href={signInHref}
              variant="contained"
              endIcon={<ArrowForwardRounded />}
            >
              {gate.action}
            </Button>
            <ul className="contribution-gate-points">
              {gate.benefits.map((point) => (
                <li key={point}>
                  <CheckCircleRounded aria-hidden="true" fontSize="small" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </Stack>
      </AppThemeProvider>
    );
  }

  return (
    <AppThemeProvider>
      <Stack
        component="form"
        spacing={2.5}
        className="contribution-form"
        onSubmit={submit}
        noValidate
        useFlexGap
      >
        {identity && (
          <p className="contribution-session">
            <span className="contribution-session-dot" aria-hidden="true" />
            {t("contributionForm.signedInAs", { name: identity })}
          </p>
        )}
        {sessionLost && (
          <Alert severity="warning" className="contribution-session-alert">
            {t("contributionForm.sessionExpired")}{" "}
            <a href={signInHref}>{t("contributionForm.signIn")}</a>
          </Alert>
        )}
        {subjectsError && (
          <Alert severity="warning">{t("contributionForm.subjectsError")}</Alert>
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
        <Autocomplete
          options={subjects}
          value={selectedSubject}
          onChange={(_event, option) => setSubjectId(option?.id ?? "")}
          getOptionLabel={subjectOptionLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterOptions={filterSubjects}
          noOptionsText={t("contributionForm.subjectNoResults")}
          loading={subjectsLoading}
          loadingText={t("contributionForm.subjectLoading")}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <span className="contribution-subject-option">
                <span className="contribution-subject-code">
                  {option.acronym}
                  {option.code ? ` (${option.code})` : ""}
                </span>
                <span className="contribution-subject-name">{option.name}</span>
                {!option.is_current && (
                  <span className="contribution-subject-tag">
                    {t("contributionForm.subjectLatest")}
                  </span>
                )}
              </span>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              required
              label={t("contributionForm.subjectLabel")}
              placeholder={t("contributionForm.subjectPlaceholder")}
              error={showValidationErrors && Boolean(fieldErrors.subject)}
              helperText={showValidationErrors ? fieldErrors.subject : ""}
              slotProps={{
                inputLabel: params.slotProps.inputLabel,
                htmlInput: params.slotProps.htmlInput,
                input: {
                  ...params.slotProps.input,
                  endAdornment: (
                    <>
                      {showValidationErrors && fieldErrors.subject && (
                        <InputAdornment position="end">
                          <ErrorOutlineRounded color="error" fontSize="small" aria-hidden="true" />
                        </InputAdornment>
                      )}
                      {params.slotProps.input?.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
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
          minRows={3}
          maxRows={10}
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
        <div className="contribution-files">
          <span className="contribution-field-label" id="contribution-files-label">
            {t("contributionForm.attachFiles")}
            <span className="contribution-required-mark" aria-hidden="true">
              *
            </span>
          </span>
          <input
            ref={fileInputRef}
            id="contribution-files-input"
            className="file-input"
            type="file"
            multiple
            required
            accept=".pdf,.txt,.c,.cpp,.png,.jpg,.jpeg,.webp,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            aria-labelledby="contribution-files-label"
            aria-describedby="contribution-files-hint"
            aria-invalid={showValidationErrors ? Boolean(fieldErrors.files) : undefined}
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              event.target.value = "";
              acceptFiles(selected);
            }}
          />
          <label
            className={`file-dropzone ${isDragging ? "file-dropzone--dragging" : ""} ${showValidationErrors && fieldErrors.files ? "file-dropzone--error" : ""}`}
            htmlFor="contribution-files-input"
            onDragEnter={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = "copy";
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDragging(false);
              const dropped = Array.from(event.dataTransfer.files ?? []);
              acceptFiles(dropped);
            }}
          >
            <span className="file-dropzone-icon" aria-hidden="true">
              <AttachFileRounded fontSize="small" />
            </span>
            <span className="file-dropzone-copy">
              <span className="file-dropzone-title">{t("contributionForm.attachFilesAction")}</span>
              <span className="file-dropzone-hint" id="contribution-files-hint">
                {t("contributionForm.attachFilesHint")}
              </span>
            </span>
          </label>
          {showValidationErrors && fieldErrors.files && (
            <FormHelperText error className="contribution-field-error">
              {fieldErrors.files}
            </FormHelperText>
          )}
          {files.length > 0 && (
            <div className="file-list">
              <div className="file-list-head">
                <span className="file-list-title">{t("contributionForm.filesTitle")}</span>
                <span className="file-list-meta">
                  {t("contributionForm.filesTotalSize")}: {formatFileSize(totalSize)}
                </span>
              </div>
              <ul className="file-items">
                {files.map((file, index) => (
                  <li className="file-item" key={`${file.name}-${file.size}-${index}`}>
                    <span className="file-item-ext" aria-hidden="true">
                      {fileExtension(file.name)}
                    </span>
                    <span className="file-item-copy">
                      <span className="file-item-name" title={file.name}>
                        {file.name}
                      </span>
                      <span className="file-item-size">{formatFileSize(file.size)}</span>
                    </span>
                    <IconButton
                      className="file-item-remove"
                      size="small"
                      aria-label={t("contributionForm.removeFile")}
                      onClick={() =>
                        setFiles((current) => current.filter((_, position) => position !== index))
                      }
                    >
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
        <Button
          className="primary-action-button"
          type="submit"
          variant="contained"
          disabled={busy || !userId}
          endIcon={<ArrowForwardRounded />}
        >
          {busy ? t("contributionForm.sending") : t("contributionForm.submit")}
        </Button>
      </Stack>
    </AppThemeProvider>
  );
}
