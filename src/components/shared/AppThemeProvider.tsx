import { useMemo, type ReactNode } from 'react';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import { fibersTheme } from '@/styles/theme';
import { getFibersEmotionCache } from './fibersEmotionCache';

/**
 * Single MUI theme provider for every island. The browser cache lives outside
 * <body> so ClientRouter's swaps cannot remove generated styles; SSR gets a
 * fresh cache per render so style insertion state cannot leak between pages.
 */
export default function AppThemeProvider({ children }: { children: ReactNode }) {
  const cache = useMemo(getFibersEmotionCache, []);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={fibersTheme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
