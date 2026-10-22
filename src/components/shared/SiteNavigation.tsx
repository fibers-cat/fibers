import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import AppTooltip from '@/components/shared/AppTooltip';
import SvgIcon from '@mui/material/SvgIcon';
import type { User } from '@supabase/supabase-js';
import MenuRounded from '@mui/icons-material/MenuRounded';import CloseRounded from '@mui/icons-material/CloseRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import MenuBookRounded from '@mui/icons-material/MenuBookRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';
import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import FactCheckRounded from '@mui/icons-material/FactCheckRounded';
import ManageAccountsRounded from '@mui/icons-material/ManageAccountsRounded';
import { siDiscord, siFacebook, siGithub } from 'simple-icons';
import { hasSupabaseConfig } from '@/services/supabase';
import { getSession, onAuthStateChange } from '@/services/auth';
import { fetchUserProfile } from '@/services/profiles';
import type { AppRole } from '@/services/roles';
import { getSocialAvatar } from '@/services/socialAvatar';
import { localizePath, stripLocalePrefix, useTranslations, type Locale, type UIKey } from '@/i18n';

const links: { path: string; labelKey: UIKey; icon: ReactElement }[] = [
  { path: '/', labelKey: 'nav.home', icon: <HomeRounded /> },
  { path: '/assignatures/', labelKey: 'nav.subjects', icon: <MenuBookRounded /> },
  { path: '/recursos/', labelKey: 'nav.resources', icon: <FolderOpenRounded /> },
  { path: '/aporta/', labelKey: 'nav.contribute', icon: <VolunteerActivismRounded /> },
  { path: '/col-laboradors/', labelKey: 'nav.contributors', icon: <GroupsRounded /> },
  { path: '/sobre/', labelKey: 'nav.about', icon: <InfoOutlined /> },
];

type Props = { currentPath: string; returnTo?: string; locale: Locale };

const socialLinks = [
  { href: 'https://github.com/fibers-cat/fibers/', label: 'GitHub', icon: siGithub },
  { href: 'https://www.facebook.com/fibers.cat/', label: 'Facebook', icon: siFacebook },
  { href: 'https://discord.gg/pqsbcBb', label: 'Discord', icon: siDiscord },
];

function SocialLinks({ className, locale }: { className: string; locale: Locale }) {
  const t = useTranslations(locale);
  return (
    <Box className={`social-links ${className}`} role="group" aria-label={t('nav.social')}>
      {socialLinks.map((link) => (
        <IconButton
          key={link.href}
          component="a"
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          title={link.label}
        >
          <SvgIcon viewBox="0 0 24 24"><path d={link.icon.path} /></SvgIcon>
        </IconButton>
      ))}
    </Box>
  );
}

function LocaleSwitcher({ currentPath, locale, tooltipVariant = 'dark' }: Props & { tooltipVariant?: 'dark' | 'sidebar' }) {
  const t = useTranslations(locale);
  const basePath = stripLocalePrefix(currentPath);
  const target = locale === 'ca' ? 'es' : 'ca';
  const label = target === 'ca' ? t('switcher.switchToCa') : t('switcher.switchToEs');
  return (
    <Box className="locale-switcher" role="group" aria-label={t('switcher.label')}>
      <AppTooltip title={label} arrow variant={tooltipVariant}>
        <a
          href={localizePath(basePath, target)}
          hrefLang={target}
          lang={target}
          className="locale-option"
          aria-label={label}
        >
          {target.toUpperCase()}
        </a>
      </AppTooltip>
    </Box>
  );
}

function NavigationLinks({ currentPath, locale, onNavigate, role }: Props & { onNavigate?: () => void; role: AppRole | null }) {
  const t = useTranslations(locale);
  const basePath = stripLocalePrefix(currentPath);
  const visibleLinks: { path: string; href: string; label: string; icon: ReactElement }[] = [
    ...links.map((link) => ({
      path: link.path,
      href: localizePath(link.path, locale),
      label: t(link.labelKey),
      icon: link.icon,
    })),
    ...(role === 'admin' || role === 'superadmin'
      ? [{ path: '/admin/aportacions/', href: localizePath('/admin/aportacions/', locale), label: t('nav.reviewContributions'), icon: <FactCheckRounded /> }]
      : []),
    ...(role === 'superadmin'
      ? [{ path: '/admin/usuaris/', href: localizePath('/admin/usuaris/', locale), label: t('nav.manageUsers'), icon: <ManageAccountsRounded /> }]
      : []),
  ];
  return (
    <List className="navigation-links" aria-label={t('nav.primary')}>
      {visibleLinks.map((link) => {
        const selected = link.path === '/' ? basePath === '/' : basePath.startsWith(link.path);
        return (
          <ListItemButton
            key={link.href}
            component="a"
            href={link.href}
            selected={selected}
            onClick={onNavigate}
            aria-current={selected ? 'page' : undefined}
            className="navigation-link"
          >
            <ListItemIcon>{link.icon}</ListItemIcon>
            <ListItemText primary={link.label} />
          </ListItemButton>
        );
      })}
    </List>
  );
}

export default function SiteNavigation({ currentPath, returnTo, locale }: Props) {
  const t = useTranslations(locale);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userAlias, setUserAlias] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [currentUrl, setCurrentUrl] = useState(returnTo ?? localizePath(currentPath, locale));
  useEffect(() => {
    const syncCurrentUrl = () => {
      setCurrentUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`);
      setOpen(false);
    };
    syncCurrentUrl();
    document.addEventListener('astro:page-load', syncCurrentUrl);
    window.addEventListener('popstate', syncCurrentUrl);
    return () => {
      document.removeEventListener('astro:page-load', syncCurrentUrl);
      window.removeEventListener('popstate', syncCurrentUrl);
    };
  }, []);
  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let active = true;
    const loadAvatar = async (user: User | null) => {
      if (!user) {
        if (active) {
          setAvatarUrl(null);
          setUserAlias(null);
          setRole(null);
        }
        return;
      }
      const socialAvatar = getSocialAvatar(user);
      if (active) setAvatarUrl(socialAvatar);
      try {
        const profile = await fetchUserProfile(user.id);
        if (active) {
          setAvatarUrl(socialAvatar ?? profile.avatarUrl ?? null);
          setUserAlias(profile.alias);
          setRole(profile.role);
        }
      } catch (error) {
        console.error('Could not load the profile avatar for navigation.', error);
        if (active) setRole(null);
      }
    };
    getSession().then((session) => {
      if (!active) return;
      setSignedIn(Boolean(session));
      void loadAvatar(session?.user ?? null);
    }).catch((error: unknown) => {
      console.error('Could not load the current authentication session.', error);
    });
    const unsubscribe = onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      window.setTimeout(() => { void loadAvatar(session?.user ?? null); }, 0);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const profilePath = localizePath('/perfil/', locale);
  const profileReturnTo = currentUrl.startsWith(profilePath) ? '' : currentUrl;
  const profileHref = signedIn || !profileReturnTo
    ? profilePath
    : `${profilePath}?returnTo=${encodeURIComponent(profileReturnTo)}`;
  const brand = (
    <a className="brand-lockup" href={localizePath('/', locale)} aria-label={t('brand.home')}>
      <img src="/images/fibers-heart.svg" alt="" width="34" height="34" />
      <span>fibers<span className="brand-dot">.</span></span>
    </a>
  );

  return (
    <AppThemeProvider>
      <aside className="desktop-sidebar">
        <div className="sidebar-brand">{brand}</div>
        <div className="sidebar-label">{t('sidebar.label')}</div>
        <NavigationLinks currentPath={currentPath} locale={locale} role={role} />
        <div className="sidebar-bottom">
          <SocialLinks className="desktop-socials" locale={locale} />
          <LocaleSwitcher currentPath={currentPath} locale={locale} tooltipVariant="sidebar" />
          <AppTooltip title={signedIn ? t('profile.yourProfile') : t('profile.signIn')} arrow variant="sidebar">
            <IconButton component="a" href={profileHref} className="profile-link" aria-label={signedIn ? t('profile.yourProfile') : t('profile.signIn')}>
              {signedIn ? (
                <Avatar src={avatarUrl ?? undefined} sx={{ width: 40, height: 40, bgcolor: avatarUrl ? 'rgba(255,255,255,.18)' : '#e94b50', color: '#fff', fontWeight: 700 }}>
                  {avatarUrl ? <PersonOutlineRounded fontSize="small" /> : (userAlias ?? '?').slice(0, 2).toUpperCase()}
                </Avatar>
              ) : <PersonOutlineRounded />}
            </IconButton>
          </AppTooltip>
        </div>
      </aside>

      <AppBar className="mobile-appbar" position="fixed" elevation={0}>
        <Toolbar className="mobile-toolbar">
          <IconButton aria-label={t('menu.open')} color="inherit" edge="start" onClick={() => setOpen(true)}>
            <MenuRounded />
          </IconButton>
          {brand}
          <LocaleSwitcher currentPath={currentPath} locale={locale} />
          <Button className="mobile-contribute" href={localizePath('/aporta/', locale)} variant="contained" size="small">{t('nav.contributeShort')}</Button>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box className="mobile-drawer">
          <div className="drawer-heading">
            {brand}
            <IconButton color="inherit" aria-label={t('menu.close')} onClick={() => setOpen(false)}><CloseRounded /></IconButton>
          </div>
          <div className="sidebar-label">{t('sidebar.label')}</div>
          <NavigationLinks currentPath={currentPath} locale={locale} role={role} onNavigate={() => setOpen(false)} />
          <div className="drawer-bottom">
            <SocialLinks className="drawer-socials" locale={locale} />
            <LocaleSwitcher currentPath={currentPath} locale={locale} tooltipVariant="sidebar" />
            <AppTooltip title={signedIn ? t('profile.yourProfile') : t('profile.signIn')} arrow variant="sidebar">
              <IconButton
                component="a"
                href={profileHref}
                className="profile-link"
                aria-label={signedIn ? t('profile.yourProfile') : t('profile.signIn')}
              >
                {signedIn ? (
                  <Avatar src={avatarUrl ?? undefined} sx={{ width: 40, height: 40, bgcolor: avatarUrl ? 'rgba(255,255,255,.18)' : '#e94b50', color: '#fff', fontWeight: 700 }}>
                    {avatarUrl ? <PersonOutlineRounded fontSize="small" /> : (userAlias ?? '?').slice(0, 2).toUpperCase()}
                  </Avatar>
                ) : <PersonOutlineRounded />}
              </IconButton>
            </AppTooltip>
          </div>
        </Box>
      </Drawer>
    </AppThemeProvider>
  );
}
