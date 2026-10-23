import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded';
import type { ReactNode } from 'react';

type Props = {
  publishedLabel: string;
  publishedValue: ReactNode;
  publishedHint: string;
  pendingLabel: string;
  pendingValue: ReactNode;
  pendingHint: string;
  rankingLabel: string;
  rankingValue: ReactNode;
  rankingHint: string;
  rankingHref?: string;
  rankingLinkLabel?: string;
};

export default function ProfileStats({
  publishedLabel,
  publishedValue,
  publishedHint,
  pendingLabel,
  pendingValue,
  pendingHint,
  rankingLabel,
  rankingValue,
  rankingHint,
  rankingHref,
  rankingLinkLabel,
}: Props) {
  return (
    <section className="profile-stats">
      <article className="profile-stat">
        <span className="profile-stat-icon profile-stat-icon--coral"><DescriptionOutlined /></span>
        <div>
          <span className="profile-stat-label">{publishedLabel}</span>
          <strong className="profile-stat-value">{publishedValue}</strong>
          <span className="profile-stat-hint">{publishedHint}</span>
        </div>
      </article>
      <article className="profile-stat">
        <span className="profile-stat-icon profile-stat-icon--amber"><HourglassEmptyRounded /></span>
        <div>
          <span className="profile-stat-label">{pendingLabel}</span>
          <strong className="profile-stat-value">{pendingValue}</strong>
          <span className="profile-stat-hint">{pendingHint}</span>
        </div>
      </article>
      <article className="profile-stat">
        <span className="profile-stat-icon profile-stat-icon--teal"><EmojiEventsOutlined /></span>
        <div>
          <span className="profile-stat-label">{rankingLabel}</span>
          <strong className="profile-stat-value">{rankingValue}</strong>
          <span className="profile-stat-hint">{rankingHint}</span>
          {rankingHref && rankingLinkLabel && (
            <a className="profile-stat-link" href={rankingHref}>{rankingLinkLabel}</a>
          )}
        </div>
      </article>
    </section>
  );
}
