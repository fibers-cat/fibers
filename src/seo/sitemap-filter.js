/**
 * Keeps canonical, indexable routes in the sitemap.
 * @param {string} page Absolute URL provided by @astrojs/sitemap.
 */
export function shouldIncludeSitemapPage(page) {
  const pathname = new URL(page).pathname;

  if (/^\/(?:es\/)?404(?:\.html)?\/?$/.test(pathname)) return false;
  if (/^\/(?:es\/)?admin(?:\/|$)/.test(pathname)) return false;
  if (/^\/(?:es\/)?perfil\/?$/.test(pathname)) return false;
  if (/^\/(?:col-laboradors|es\/(?:colaboradores|col-laboradors))\/?$/.test(pathname)) return false;

  // Redirect aliases and fallback URLs are not canonical content pages.
  if (/^\/(?:guia|condicions|es\/guia|es\/condiciones)\/?$/.test(pathname)) return false;
  if (/^\/es\/(?:sobre|contacte|condicions-us|com-funciona|assignatures)(?:\/|$)/.test(pathname)) {
    return false;
  }

  return true;
}
