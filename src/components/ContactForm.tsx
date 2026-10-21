import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import { ThemeProvider } from "@mui/material/styles";
import { fibersTheme } from "@/components/shared/theme";
import { localizePath, useTranslations, type Locale } from "@/i18n";

type Submission = {
  severity: "success" | "error";
  message: string;
};

type ValidationErrors = Partial<Record<ContactField, string>>;

type ContactField = "name" | "email" | "subject" | "message";

type Props = { locale: Locale };

export default function ContactForm({ locale }: Props) {
  const t = useTranslations(locale);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [busy, setBusy] = useState(false);

  const getValidationErrors = (form: HTMLFormElement): ValidationErrors => {
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const subject = String(values.get("subject") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    const emailInput = form.querySelector<HTMLInputElement>("#contact-email");

    return {
      ...(!name && { name: t("contactForm.validation.name") }),
      ...(!email
        ? { email: t("contactForm.validation.emailRequired") }
        : emailInput && !emailInput.validity.valid
          ? { email: t("contactForm.validation.emailInvalid") }
          : {}),
      ...(!subject && { subject: t("contactForm.validation.subject") }),
      ...(!message && { message: t("contactForm.validation.message") }),
    };
  };

  const validateForm = (form: HTMLFormElement) => {
    const errors = getValidationErrors(form);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateForm(form)) return;

    setBusy(true);
    setSubmission(null);

    const payload = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === "string") payload.append(key, value);
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
      });

      if (!response.ok) {
        throw new Error(`Contact form request failed with status ${response.status}.`);
      }

      form.reset();
      setValidationErrors({});
      setSubmission({
        severity: "success",
        message: t("contactForm.success"),
      });
    } catch (error) {
      console.error("Could not submit the contact form.", error);
      setSubmission({
        severity: "error",
        message: t("contactForm.error"),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemeProvider theme={fibersTheme}>
      <Stack
        component="form"
        className="contact-form"
        name="contacte"
        method="POST"
        action={localizePath("/contacte/", locale)}
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        netlify-honeypot="bot-field"
        noValidate
        spacing={2.5}
        useFlexGap
        onSubmit={submit}
        onInvalid={(event) => {
          event.preventDefault();
          setValidationErrors(getValidationErrors(event.currentTarget));
        }}
        onChange={(event) => {
          if (Object.keys(validationErrors).length > 0) {
            setValidationErrors(getValidationErrors(event.currentTarget));
          }
        }}
      >
        <input type="hidden" name="form-name" value="contacte" />
        <div className="contact-honeypot" aria-hidden="true">
          <label>
            {t("contactForm.honeypot")}
            <input name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <TextField
          required
          id="contact-name"
          name="name"
          label={t("contactForm.name")}
          autoComplete="name"
          error={Boolean(validationErrors.name)}
          helperText={validationErrors.name}
          slotProps={{
            input: {
              endAdornment: validationErrors.name ? (
                <InputAdornment position="end">
                  <ErrorOutlineRounded color="error" fontSize="small" aria-hidden="true" />
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        <TextField
          required
          id="contact-email"
          name="email"
          type="email"
          label={t("contactForm.email")}
          autoComplete="email"
          error={Boolean(validationErrors.email)}
          helperText={validationErrors.email}
          slotProps={{
            input: {
              endAdornment: validationErrors.email ? (
                <InputAdornment position="end">
                  <ErrorOutlineRounded color="error" fontSize="small" aria-hidden="true" />
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        <TextField
          required
          id="contact-subject"
          name="subject"
          label={t("contactForm.subject")}
          error={Boolean(validationErrors.subject)}
          helperText={validationErrors.subject}
          slotProps={{
            input: {
              endAdornment: validationErrors.subject ? (
                <InputAdornment position="end">
                  <ErrorOutlineRounded color="error" fontSize="small" aria-hidden="true" />
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        <TextField
          required
          id="contact-message"
          name="message"
          label={t("contactForm.message")}
          multiline
          minRows={5}
          error={Boolean(validationErrors.message)}
          helperText={validationErrors.message}
          slotProps={{
            input: {
              endAdornment: validationErrors.message ? (
                <InputAdornment
                  position="end"
                  sx={{ alignSelf: "flex-start" }}
                >
                  <ErrorOutlineRounded color="error" fontSize="small" aria-hidden="true" />
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        {submission && (
          <Alert severity={submission.severity} role="status">
            {submission.message}
          </Alert>
        )}

        <Button
          className="primary-action-button"
          type="submit"
          variant="contained"
          disabled={busy}
          endIcon={<ArrowForwardRounded />}
          sx={{ alignSelf: "flex-start" }}
        >
          {busy ? t("contactForm.sending") : t("contactForm.submit")}
        </Button>
      </Stack>
    </ThemeProvider>
  );
}
