import type { ReactNode } from 'react';
import { statusColor } from '../../lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  children?: ReactNode;
}

export function Badge({ status, label, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${statusColor(status)}`}
    >
      {children ?? label ?? status}
    </span>
  );
}
