import createCache, { type EmotionCache } from '@emotion/cache';

const CACHE_KEY = '__fibersEmotionCache__';
const CONTAINER_ID = 'fibers-emotion-styles';

function getOrCreateContainer(): HTMLDivElement {
  let container = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.display = 'none';
    document.documentElement.appendChild(container);
  }
  return container;
}

function createClientCache(): EmotionCache {
  return createCache({ key: 'fibers', container: getOrCreateContainer() });
}

/**
 * Emotion's `inserted` registry must be request-scoped during SSR. Reusing a
 * server cache across requests makes later HTML omit styles it saw earlier.
 * In the browser, share one cache across islands and ClientRouter navigations.
 */
export function getFibersEmotionCache(): EmotionCache {
  if (typeof document === 'undefined') {
    return createCache({ key: 'fibers' });
  }

  const globalObject = globalThis as { [CACHE_KEY]?: EmotionCache };
  if (!globalObject[CACHE_KEY]) {
    globalObject[CACHE_KEY] = createClientCache();
  }
  return globalObject[CACHE_KEY];
}
