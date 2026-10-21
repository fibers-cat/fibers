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
  'com-funciona': { ca: 'com-funciona', es: 'como-funciona' },
  'recursos': { ca: 'recursos', es: 'recursos' },
  'contacte': { ca: 'contacte', es: 'contacto' },
  'aporta': { ca: 'aporta', es: 'aporta' },
  'perfil': { ca: 'perfil', es: 'perfil' },
  'condicions-us': { ca: 'condicions-us', es: 'condiciones-uso' },
  'col-laboradors': { ca: 'col-laboradors', es: 'colaboradores' },
  'assignatures': { ca: 'assignatures', es: 'asignaturas' },
  'admin/aportacions': { ca: 'admin/aportacions', es: 'admin/aportaciones' },
  'admin/usuaris': { ca: 'admin/usuaris', es: 'admin/usuarios' },
};

/** Returns the longest canonical route key that matches the start of a path. */
function matchRouteKey(path: string): string | null {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  const keys = Object.keys(routeSlugs).sort((a, b) => b.length - a.length);
  return keys.find((key) => normalized === key || normalized.startsWith(`${key}/`)) ?? null;
}

/** Maps a canonical path to its localized slug, including nested routes. */
function translateSlug(base: string, locale: Locale): string {
  const key = matchRouteKey(base);
  if (!key) return base;
  const normalized = base.replace(/^\/+|\/+$/g, '');
  const slugs = routeSlugs[key];
  if (!slugs) return base;
  const localized = slugs[locale];
  const rest = normalized.slice(key.length);
  const result = `${localized}${rest}`;
  return result ? `/${result}/` : base;
}

/** Reverses a localized slug back to the canonical (Catalan) path. */
function canonicalizeSlug(localizedPath: string, locale: Locale): string {
  const normalized = localizedPath.replace(/^\/+|\/+$/g, '');
  const entries = Object.entries(routeSlugs)
    .map(([canonical, slugs]) => ({ canonical, localized: slugs[locale] }))
    .sort((a, b) => b.localized.length - a.localized.length);
  const match = entries.find(
    ({ localized }) => normalized === localized || normalized.startsWith(`${localized}/`),
  );
  if (!match) return localizedPath;
  const rest = normalized.slice(match.localized.length);
  const result = `${match.canonical}${rest}`;
  return result ? `/${result}/` : localizedPath;
}

/**
 * Localizes any internal path for the given locale.
 * e.g. `/sobre/` + `es` → `/es/acerca/`.
 */
export function localizePath(path: string, locale: Locale): string {
  const queryIndex = path.search(/[?#]/);
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const suffix = queryIndex === -1 ? '' : path.slice(queryIndex);
  const base = stripLocalePrefix(pathname);
  const localizedBase = translateSlug(base, locale);
  const localized = locale === defaultLocale ? localizedBase : `/${locale}${localizedBase}`;
  return `${localized}${suffix}`;
}

/**
 * Returns the canonical (Catalan) logical path for a localized pathname.
 * e.g. `/es/acerca/` → `/sobre/`.
 */
export function canonicalPath(pathname: string, locale: Locale): string {
  const base = stripLocalePrefix(pathname);
  return canonicalizeSlug(base, locale);
}

