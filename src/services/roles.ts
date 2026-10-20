export type AppRole = 'user' | 'admin' | 'superadmin';

export function isAppRole(value: unknown): value is AppRole {
  return value === 'user' || value === 'admin' || value === 'superadmin';
}
