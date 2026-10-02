import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

export default function SiteBreadcrumbs({ items }: Props) {
  return (
    <Breadcrumbs
      separator="/"
      aria-label="Fil d’Ariadna"
      className="breadcrumbs"
      sx={{
        color: '#8b929d',
        fontSize: '10px',
        fontWeight: 800,
        letterSpacing: '1.7px',
        '& .MuiLink-root, & .MuiTypography-root, & .MuiBreadcrumbs-separator': {
          color: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          letterSpacing: 'inherit',
        },
      }}
    >
      {items.map((item, index) => item.href ? (
        <Link key={`${item.href}-${item.label}`} href={item.href} color="inherit" underline="none">
          {item.label}
        </Link>
      ) : (
        <Typography key={`${index}-${item.label}`} component="span" variant="inherit" color="inherit">
          {item.label}
        </Typography>
      ))}
    </Breadcrumbs>
  );
}