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

function createFibersCache(): EmotionCache {
  if (typeof document === 'undefined') {
    return createCache({ key: 'fibers' });
  }
  return createCache({ key: 'fibers', container: getOrCreateContainer() });
}

const globalObject = globalThis as { [CACHE_KEY]?: EmotionCache };

if (!globalObject[CACHE_KEY]) {
  globalObject[CACHE_KEY] = createFibersCache();
}

export const fibersEmotionCache: EmotionCache = globalObject[CACHE_KEY];
