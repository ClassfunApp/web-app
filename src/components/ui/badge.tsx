import type { ReactNode } from 'react';
import { cn, statusColor } from '../../lib/utils';

interface BadgeProps {
  status?: string;
  label?: string;
  children?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantColors: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function Badge({ status, label, children, variant, className }: BadgeProps) {
  const colorClass = variant
    ? variantColors[variant]
    : statusColor(status ?? 'default');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none',
        colorClass,
        className
      )}
    >
      {children ?? label ?? status}
    </span>
  );
}
