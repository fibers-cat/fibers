import type { ReactElement } from 'react';
import Tooltip, { type TooltipProps } from '@mui/material/Tooltip';

/**
 * App-styled tooltip.
 *
 * A thin wrapper around MUI's Tooltip that applies the Fibers design language:
 * a dark ink surface, softer rounding and a subtle shadow. It accepts every
 * MUI Tooltip prop, so it works as a drop-in replacement.
 */
export type AppTooltipProps = TooltipProps;

export default function AppTooltip({ slotProps, ...props }: AppTooltipProps): ReactElement {
  return (
    <Tooltip
      {...props}
      slotProps={{
        ...slotProps,
        tooltip: {
          ...slotProps?.tooltip,
          sx: [
            {
              backgroundColor: 'text.primary',
              color: 'background.paper',
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
            { color: 'text.primary' },
            ...(Array.isArray(slotProps?.arrow?.sx) ? slotProps.arrow.sx : [slotProps?.arrow?.sx]),
          ],
        },
      }}
    />
  );
}
