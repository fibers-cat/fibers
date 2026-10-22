import type { ReactElement } from 'react';
import Tooltip, { type TooltipOwnerState, type TooltipProps } from '@mui/material/Tooltip';
import type { SxProps, Theme } from '@mui/material/styles';

type SlotWithSx = { sx?: SxProps<Theme> | undefined };

function mergeSlotSx<T extends SlotWithSx>(
  slot: T | ((ownerState: TooltipOwnerState) => T) | undefined,
  baseSx: SxProps<Theme>,
): T | ((ownerState: TooltipOwnerState) => T) {
  const merge = (sx: SxProps<Theme> | undefined) =>
    [baseSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as SxProps<Theme>;

  if (typeof slot === 'function') {
    return (ownerState: TooltipOwnerState) => {
      const resolved = slot(ownerState);
      return { ...resolved, sx: merge(resolved.sx) };
    };
  }

  return { ...slot, sx: merge(slot?.sx) } as T;
}

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
        tooltip: mergeSlotSx(slotProps?.tooltip, {
          backgroundColor,
          color,
          borderRadius: '10px',
          padding: '7px 11px',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.35,
          letterSpacing: '0.2px',
          maxWidth: 260,
          boxShadow: '0 8px 24px rgba(32, 36, 44, 0.22)',
        }),
        arrow: mergeSlotSx(slotProps?.arrow, { color: backgroundColor }),
      }}
    />
  );
}
