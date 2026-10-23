# Discord notification secrets

The notification Edge Function requires `WEBHOOK_SECRET` and fails closed if it is missing.

Run `npm run security:rotate-discord` after authenticating the Supabase CLI. It generates a new random secret, updates Edge Function Secrets and Vault, deploys the function without gateway JWT verification (the shared secret is mandatory in the handler), applies the migration, and checks that unauthenticated requests are rejected. Do not reuse the value from the historical migration.

The trigger reads the secret from Vault and passes it to the function. The migration contains only the Vault entry name, never the secret value. Until both secrets are configured, inserts continue normally and Discord notifications are skipped.
