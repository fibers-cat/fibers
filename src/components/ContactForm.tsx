import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import { ThemeProvider } from "@mui/material/styles";
import { fibersTheme } from "@/components/theme";

type SubmissionState = {
  severity: "success" | "error";
  message: string;
} | null;

type ContactField = "name" | "email" | "subject" | "message";
type ValidationErrors = Partial<Record<ContactField, string>>;

export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [submission, setSubmission] = useState<SubmissionState>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const getValidationErrors = (form: HTMLFormElement): ValidationErrors => {
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const subject = String(values.get("subject") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    const emailInput = form.querySelector<HTMLInputElement>("#contact-email");

    return {
      ...(!name && { name: "Escriu el teu nom." }),
      ...(!email
        ? { email: "Escriu el teu correu electrònic." }
        : emailInput && !emailInput.validity.valid
          ? { email: "Introdueix un correu electrònic vàlid." }
          : {}),
      ...(!subject && { subject: "Escriu l’assumpte del missatge." }),
      ...(!message && { message: "Escriu el missatge." }),
    };
  };

  const validateForm = (form: HTMLFormElement) => {
    const errors = getValidationErrors(form);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

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
        message: "Missatge enviat correctament. Et respondrem aviat.",
      });
    } catch (error) {
      console.error("Could not submit the contact form.", error);
      setSubmission({
        severity: "error",
        message: "No s’ha pogut enviar el missatge. Torna-ho a provar més tard.",
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
        action="/contacte/"
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
            No emplenis aquest camp:
            <input name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <TextField
          id="contact-name"
          name="name"
          label="Nom"
          autoComplete="name"
          required
          fullWidth
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
          id="contact-email"
          name="email"
          type="email"
          label="Correu electrònic"
          autoComplete="email"
          required
          fullWidth
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
          id="contact-subject"
          name="subject"
          label="Assumpte"
          required
          fullWidth
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
          id="contact-message"
          name="message"
          label="Missatge"
          multiline
          minRows={6}
          required
          fullWidth
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
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form && !validateForm(form)) event.preventDefault();
          }}
          endIcon={<ArrowForwardRounded />}
          sx={{ alignSelf: "flex-start" }}
        >
          {busy ? "Enviant…" : "Envia el missatge"}
        </Button>
      </Stack>
    </ThemeProvider>
  );
}
