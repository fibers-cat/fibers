import { useEffect, useState } from 'react';
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
import SvgIcon from '@mui/material/SvgIcon';
import type { User } from '@supabase/supabase-js';
import MenuRounded from '@mui/icons-material/MenuRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import MenuBookRounded from '@mui/icons-material/MenuBookRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';
import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import { siDiscord, siFacebook, siGithub } from 'simple-icons';
import { ThemeProvider } from '@mui/material/styles';
import { fibersTheme } from './theme';
import { supabase } from '../lib/supabase';
import { getSocialAvatar } from '../lib/socialAvatar';

const links = [
  { href: '/', label: 'Inici', icon: <HomeRounded /> },
  { href: '/assignatures/', label: 'Assignatures', icon: <MenuBookRounded /> },
  { href: '/recursos/', label: 'Recursos generals', icon: <FolderOpenRounded /> },
  { href: '/aporta/', label: 'Aporta material', icon: <VolunteerActivismRounded /> },
  { href: '/col-laboradors/', label: 'Col·laboradors', icon: <GroupsRounded /> },
  { href: '/sobre/', label: 'Sobre Fibers', icon: <InfoOutlined /> },
];

type Props = { currentPath: string };

const socialLinks = [
  { href: 'https://github.com/fibers-cat/fibers/', label: 'GitHub', icon: siGithub },
  { href: 'https://www.facebook.com/fibers.cat/', label: 'Facebook', icon: siFacebook },
  { href: 'https://discord.gg/nnd2EHGZEm', label: 'Discord', icon: siDiscord },
];

function SocialLinks({ className }: { className: string }) {
  return (
    <Box className={`social-links ${className}`} role="group" aria-label="Xarxes socials">
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

function NavigationLinks({ currentPath, onNavigate }: Props & { onNavigate?: () => void }) {
  return (
    <List className="navigation-links" aria-label="Navegació principal">
      {links.map((link) => {
        const selected = link.href === '/' ? currentPath === '/' : currentPath.startsWith(link.href);
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

export default function SiteNavigation({ currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const loadAvatar = async (user: User | null) => {
      if (!user) {
        if (active) setAvatarUrl(null);
        return;
      }
      const socialAvatar = getSocialAvatar(user);
      if (active) setAvatarUrl(socialAvatar);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Could not load the profile avatar for navigation.', error);
        return;
      }
      if (active) setAvatarUrl(socialAvatar ?? profile?.avatar_url ?? null);
    };
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Could not load the current authentication session.', error);
        return;
      }
      if (!active) return;
      setSignedIn(Boolean(data.session));
      void loadAvatar(data.session?.user ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      window.setTimeout(() => { void loadAvatar(session?.user ?? null); }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const brand = (
    <a className="brand-lockup" href="/" aria-label="Fibers, inici">
      <img src="/images/fibers-heart.svg" alt="" width="34" height="34" />
      <span>fibers<span className="brand-dot">.</span></span>
    </a>
  );

  return (
    <ThemeProvider theme={fibersTheme}>
      <aside className="desktop-sidebar">
        <div className="sidebar-brand">{brand}</div>
        <div className="sidebar-label">ESPAI D’ESTUDI</div>
        <NavigationLinks currentPath={currentPath} />
        <div className="sidebar-bottom">          
          <SocialLinks className="desktop-socials" />
          <IconButton component="a" href="/perfil/" className="profile-link" aria-label={signedIn ? 'El teu perfil' : 'Inicia sessió'} title={signedIn ? 'El teu perfil' : 'Inicia sessió'}>
            {signedIn ? (
              <Avatar src={avatarUrl ?? undefined} sx={{ width: 30, height: 30, bgcolor: 'rgba(255,255,255,.18)', color: '#fff' }}>
                <PersonOutlineRounded fontSize="small" />
              </Avatar>
            ) : <PersonOutlineRounded />}
          </IconButton>
        </div>
      </aside>

      <AppBar className="mobile-appbar" position="fixed" elevation={0}>
        <Toolbar className="mobile-toolbar">
          <IconButton aria-label="Obre el menú" color="inherit" edge="start" onClick={() => setOpen(true)}>
            <MenuRounded />
          </IconButton>
          {brand}
          <Button className="mobile-contribute" href="/aporta/" variant="contained" size="small">Aporta</Button>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box className="mobile-drawer">
          <div className="drawer-heading">
            {brand}
            <IconButton aria-label="Tanca el menú" onClick={() => setOpen(false)}><CloseRounded /></IconButton>
          </div>
          <NavigationLinks currentPath={currentPath} onNavigate={() => setOpen(false)} />
          <SocialLinks className="drawer-socials" />
        </Box>
      </Drawer>
    </ThemeProvider>
  );
}
