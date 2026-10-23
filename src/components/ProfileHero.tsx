import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import type { AppRole } from '@/services/roles';

type Props = {
  avatarUrl: string | null;
  avatarAlt: string;
  displayName: string;
  email: string;
  providerLabel: string;
  providerDescription: string;
  role: AppRole | null;
  roleLabel: string;
  signOutLabel: string;
  disabled: boolean;
  onSignOut: () => void;
};

export default function ProfileHero({
  avatarUrl,
  avatarAlt,
  displayName,
  email,
  providerLabel,
  providerDescription,
  role,
  roleLabel,
  signOutLabel,
  disabled,
  onSignOut,
}: Props) {
  return (
    <section className="profile-hero">
      <Avatar
        src={avatarUrl ?? undefined}
        alt={avatarAlt}
        sx={{ width: 76, height: 76, bgcolor: 'grey.100', color: 'text.secondary', border: '1px solid #e6e8ec' }}
      >
        <PersonOutlineRounded fontSize="large" />
      </Avatar>
      <div className="profile-hero-body">
        <h2 className="profile-hero-name">{displayName}</h2>
        <p className="profile-hero-meta">
          {email}
          {providerLabel && (
            <span
              className="profile-provider"
              title={providerDescription}
            >
              {providerLabel}
            </span>
          )}
          {role && <span className={`profile-role profile-role--${role}`}>{roleLabel}</span>}
        </p>
      </div>
      <Button
        variant="outlined"
        className="profile-signout"
        onClick={onSignOut}
        disabled={disabled}
        startIcon={<LogoutRounded />}
      >
        {signOutLabel}
      </Button>
    </section>
  );
}
