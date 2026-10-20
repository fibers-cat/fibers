import type { Locale } from './config';
import ca from './locales/ca.json';
import es from './locales/es.json';

/**
 * JSON dictionaries with every literal of the site.
 * `ca` is the canonical shape; `es` must mirror it exactly.
 */
export const dictionaries = { ca, es };

export type Dictionary = typeof ca;

/** Union of every dot-separated path that resolves to a string leaf. */
type PathsOf<T> = T extends string
  ? never
  : T extends readonly unknown[]
    ? never
    : {
        [K in keyof T & string]: T[K] extends string | readonly unknown[]
          ? K
          : `${K}.${PathsOf<T[K]>}`;
      }[keyof T & string];

export type UIKey = PathsOf<Dictionary>;

/** Compile-time check that `es` defines every key present in `ca`. */
type MissingSpanishKeys = Exclude<UIKey, PathsOf<typeof es>>;
const assertSpanishIsComplete: MissingSpanishKeys extends never ? true : MissingSpanishKeys = true;
void assertSpanishIsComplete;

function resolve(dictionary: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      dictionary,
    );
}

/** Returns the raw dictionary for a locale (used for arrays and nested objects). */
export function getDictionary(locale: Locale): Dictionary {
  return (dictionaries[locale] ?? dictionaries.ca) as Dictionary;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Returns a translate function bound to the given locale. */
export function useTranslations(locale: Locale) {
  return (key: UIKey, params?: Record<string, string | number>): string => {
    const value = resolve(dictionaries[locale] ?? dictionaries.ca, key) ?? resolve(ca, key);
    if (typeof value !== 'string') return key;
    return interpolate(value, params);
  };
}

/** BCP-47 tag used for date and number formatting. */
export function intlLocale(locale: Locale): string {
  return locale === 'es' ? 'es-ES' : 'ca-ES';
}
