export const locales = ['ca', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ca';

export const localeNames: Record<Locale, string> = {
  ca: 'Català',
  es: 'Castellano',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Returns the locale of a pathname, derived from its first path segment. */
export function getLocaleFromPathname(pathname: string): Locale {
  const [, first] = pathname.split('/');
  return isLocale(first) ? first : defaultLocale;
}

/** Returns the locale of a URL, derived from its pathname. */
export function getLocaleFromUrl(url: URL): Locale {
  return getLocaleFromPathname(url.pathname);
}

/** Removes a leading locale prefix from a pathname (e.g. `/es/sobre/` → `/sobre/`). */
export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/');
  if (isLocale(segments[1])) {
    segments.splice(1, 1);
  }
  return segments.join('/') || '/';
}

/**
 * Route slugs per locale. Keys are the canonical (Catalan) logical routes;
 * values are the localized path segments. Routes not listed here keep the
 * same slug in every locale.
 *
 * Translation is applied to the leading segment so nested routes keep their
 * own slugs, e.g. `/assignatures/<slug>/` → `/es/asignaturas/<slug>/`.
 */
export const routeSlugs: Record<string, Record<Locale, string>> = {
  'sobre': { ca: 'sobre', es: 'acerca' },
  'guia': { ca: 'guia', es: 'guia' },
  'recursos': { ca: 'recursos', es: 'recursos' },
  'contacte': { ca: 'contacte', es: 'contacto' },
  'aporta': { ca: 'aporta', es: 'aporta' },
  'perfil': { ca: 'perfil', es: 'perfil' },
  'condicions': { ca: 'condicions', es: 'condiciones' },
  'col-laboradors': { ca: 'col-laboradors', es: 'colaboradores' },
  'assignatures': { ca: 'assignatures', es: 'asignaturas' },
  'admin/aportacions': { ca: 'admin/aportacions', es: 'admin/aportaciones' },
  'admin/usuaris': { ca: 'admin/usuaris', es: 'admin/usuarios' },
};

/** Splits a path into its leading route segment and the remaining suffix. */
function splitLead(path: string): { lead: string; rest: string } {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  const slashIndex = normalized.indexOf('/');
  if (slashIndex === -1) return { lead: normalized, rest: '' };
  return { lead: normalized.slice(0, slashIndex), rest: normalized.slice(slashIndex) };
}

/** Maps the leading segment of a canonical path to its localized slug. */
function translateSlug(base: string, locale: Locale): string {
  const { lead, rest } = splitLead(base);
  const localized = routeSlugs[lead]?.[locale];
  const localizedLead = localized ? localized.split('/')[0] : lead;
  const localizedRest = localized && localized.includes('/') ? localized.slice(localized.indexOf('/')) : rest;
  const result = `${localizedLead}${localizedRest}`;
  return result ? `/${result}/` : base;
}

/** Reverses a localized slug back to the canonical (Catalan) path. */
function canonicalizeSlug(localizedPath: string, locale: Locale): string {
  const { lead, rest } = splitLead(localizedPath);
  const key = Object.keys(routeSlugs).find((candidate) => routeSlugs[candidate][locale].split('/')[0] === lead);
  if (!key) return localizedPath;
  const canonical = key.includes('/') ? key.slice(key.indexOf('/')) : rest;
  const result = `${key.split('/')[0]}${canonical}`;
  return result ? `/${result}/` : localizedPath;
}

/**
 * Localizes any internal path for the given locale.
 * e.g. `/sobre/` + `es` → `/es/acerca/`.
 */
export function localizePath(path: string, locale: Locale): string {
  const base = stripLocalePrefix(path);
  const localizedBase = translateSlug(base, locale);
  if (locale === defaultLocale) return localizedBase;
  return `/${locale}${localizedBase}`;
}

/**
 * Returns the canonical (Catalan) logical path for a localized pathname.
 * e.g. `/es/acerca/` → `/sobre/`.
 */
export function canonicalPath(pathname: string, locale: Locale): string {
  const base = stripLocalePrefix(pathname);
  return canonicalizeSlug(base, locale);
}

