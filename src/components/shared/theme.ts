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
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { styleOverrides: { root: { border: '1px solid #e6e8ec' } } },
  },
});
