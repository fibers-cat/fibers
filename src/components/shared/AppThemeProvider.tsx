import { type ReactNode } from 'react';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import { fibersTheme } from '@/styles/theme';
import { fibersEmotionCache } from './fibersEmotionCache';

/**
 * Single MUI theme + Emotion cache provider for every island.
 * The cache lives outside <body> so ClientRouter's head/body swap
 * cannot remove the generated styles.
 */
export default function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <CacheProvider value={fibersEmotionCache}>
      <ThemeProvider theme={fibersTheme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
