# Correos de Supabase Auth (MJML)

Carpeta `supabase/emails/` para construir los correos transactionales de Supabase Auth con MJML.

## Estructura

- `src/_layout.mjml` — layout compartido (header con logo de Fibers, contenedor blanco, footer).
- `src/<slug>.mjml` — cada plantilla (solo el cuerpo, se inyecta en `<!--CONTENT-->`).
- `scripts/build.js` — compila todo con `mjml` y escribe en `out/`.
- `out/<slug>.html` — HTML final listo para subir a Supabase.

## Uso

```bash
cd supabase/emails
npm install
npm run build          # compila una vez
npm run build:watch    # recompila al guardar
```

## Correspondencia con Supabase Auth

| Archivo | Template de Supabase |
|---|---|
| `confirm-signup` | Confirm sign up |
| `invite` | Invite user |
| `magic-link` | Magic link / OTP |
| `change-email` | Change email address |
| `reset-password` | Reset password |
| `reauthentication` | Reauthentication |
| `signin-linked` | Sign-in method linked |
| `signin-removed` | Sign-in method removed |

## Subir a Supabase Cloud (Management API)

Hay un script que hace el PATCH automáticamente:

```bash
# 1. Crea un access token en https://supabase.com/dashboard/account/tokens
#    (scope: projects read/write o all)

# 2. Copia .env.example a .env en esta carpeta y rellena los valores:
#    SUPABASE_PROJECT_REF=your-project-ref
#    SUPABASE_ACCESS_TOKEN=sbp_...

# 3. (Opcional) preview sin enviar nada
$env:SUPABASE_ACCESS_TOKEN="sbp_..."; npm run push:dry

# 4. Subir todos
$env:SUPABASE_ACCESS_TOKEN="sbp_..."; npm run push

# Subir solo uno
$env:SUPABASE_ACCESS_TOKEN="sbp_..."; node scripts/push.js --only reset-password
```

El script lee `SUPABASE_PROJECT_REF` (default `tytvxtdaafbqakskwkdu`) y `SUPABASE_ACCESS_TOKEN` del entorno.
```

El script lee `out/<slug>.html` (HTML completo, con `<head>` y estilos) y hace PATCH a
`https://api.supabase.com/v1/projects/<ref>/config/auth` con las claves
`mailer_subjects_*` y `mailer_templates_*_content`.

**Antes de subir**, activa SMTP custom en el dashboard:
Project Settings → Auth → SMTP Settings. En free plan, sin SMTP custom no se pueden
editar templates (limitación de Supabase).

## Subir a Supabase Local (CLI + Docker)

1. Arranca Docker Desktop.
2. Descomenta en `supabase/config.toml` las secciones `[auth.email.template.*]`
   con `content_path = "./emails/out/<slug>.html"` (y las de notificación).
3. `npx supabase start` (levanta Postgres + GoTrue + Inbucket en http://127.0.0.1:54324).
4. Los emails se capturan en Inbucket (http://127.0.0.1:54324) — no se envían de verdad.

## Mapeo slug → claves Management API

| slug | subject key | content key |
|---|---|---|
| confirm-signup | `mailer_subjects_confirmation` | `mailer_templates_confirmation_content` |
| invite | `mailer_subjects_invite` | `mailer_templates_invite_content` |
| magic-link | `mailer_subjects_magic_link` | `mailer_templates_magic_link_content` |
| change-email | `mailer_subjects_email_change` | `mailer_templates_email_change_content` |
| reset-password | `mailer_subjects_recovery` | `mailer_templates_recovery_content` |
| reauthentication | `mailer_subjects_reauthentication` | `mailer_templates_reauthentication_content` |
| signin-linked | `mailer_subjects_identity_linked` | `mailer_templates_identity_linked_content` |
| signin-removed | `mailer_subjects_identity_unlinked` | `mailer_templates_identity_unlinked_content` |


## Variables de Supabase disponibles

`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`, `{{ .Provider }}`, `{{ .SiteURL }}`.
Los textos están en catalán; el idioma del correo es fijo (catalán) independientemente del idioma del usuario, ya que Supabase envía un único correo por acción.
