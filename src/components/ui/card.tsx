import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';
import type React from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className, hover, animate, style }: CardProps) {
  return (
    <div
      style={style}
      className={cn(
        'bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]',
        hover && 'card-hover',
        animate && 'animate-slide-up opacity-0 [animation-fill-mode:forwards]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

/* ─── Skeleton card ─────────────────────────────────────────── */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-6 space-y-3">
      <div className="skeleton h-4 w-32 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('skeleton h-3 rounded', i % 2 === 0 ? 'w-full' : 'w-4/5')} />
      ))}
    </div>
  );
}
