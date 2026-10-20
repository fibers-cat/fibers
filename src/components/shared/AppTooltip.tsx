import type { ReactElement } from 'react';
import Tooltip, { type TooltipProps } from '@mui/material/Tooltip';

/**
 * App-styled tooltip.
 *
 * A thin wrapper around MUI's Tooltip that applies the Fibers design language:
 * a dark ink surface, softer rounding and a subtle shadow. It accepts every
 * MUI Tooltip prop, so it works as a drop-in replacement.
 *
 * Use `variant="sidebar"` for tooltips triggered from the dark left navigation
 * so the surface reads like the active menu item instead of blending into the
 * sidebar background.
 */
export type AppTooltipProps = TooltipProps & {
  variant?: 'dark' | 'sidebar';
};

export default function AppTooltip({ slotProps, variant = 'dark', ...props }: AppTooltipProps): ReactElement {
  const isSidebar = variant === 'sidebar';
  const backgroundColor = isSidebar ? 'rgba(255, 255, 255, 0.88)' : 'text.primary';
  const color = isSidebar ? 'text.primary' : 'background.paper';
  return (
    <Tooltip
      {...props}
      slotProps={{
        ...slotProps,
        tooltip: {
          ...slotProps?.tooltip,
          sx: [
            {
              backgroundColor,
              color,
              borderRadius: '10px',
              padding: '7px 11px',
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.35,
              letterSpacing: '0.2px',
              maxWidth: 260,
              boxShadow: '0 8px 24px rgba(32, 36, 44, 0.22)',
            },
            ...(Array.isArray(slotProps?.tooltip?.sx) ? slotProps.tooltip.sx : [slotProps?.tooltip?.sx]),
          ],
        },
        arrow: {
          ...slotProps?.arrow,
          sx: [
            { color: backgroundColor },
            ...(Array.isArray(slotProps?.arrow?.sx) ? slotProps.arrow.sx : [slotProps?.arrow?.sx]),
          ],
        },
      }}
    />
  );
}
