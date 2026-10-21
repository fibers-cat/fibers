import { createTheme } from '@mui/material/styles';

export const fibersTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#e94b50', dark: '#c6373d', contrastText: '#fff' },
    secondary: { main: '#158b84', contrastText: '#fff' },
    background: { default: '#f6f7f9', paper: '#ffffff' },
    text: { primary: '#20242c', secondary: '#69717d' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Roboto Variable", "Helvetica Neue", Arial, sans-serif',
    htmlFontSize: 16,
    fontSize: 16,
    body1: { fontSize: '1rem', lineHeight: 1.65 },
    body2: { fontSize: '0.9375rem', lineHeight: 1.65 },
    caption: { fontSize: '0.875rem', lineHeight: 1.5 },
    overline: { fontSize: '0.75rem', letterSpacing: '0.08em', lineHeight: 1.5 },
    h3: { fontSize: '2rem', lineHeight: 1.2 },
    h4: { fontSize: '1.75rem', lineHeight: 1.25 },
    h5: { fontSize: '1.375rem', lineHeight: 1.3 },
    h6: { fontSize: '1.125rem', lineHeight: 1.35 },
    button: { textTransform: 'none', fontWeight: 700, fontSize: '1rem' },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { styleOverrides: { root: { border: '1px solid #e6e8ec' } } },
    MuiFormHelperText: {
      styleOverrides: { root: { fontSize: '0.875rem', lineHeight: 1.5 } },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          '&.MuiInputLabel-shrink': { fontSize: '0.875rem' },
        },
      },
    },
  },
});
