import type { ReactNode } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  trend?: number;
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  iconBg = 'bg-indigo-100',
  iconColor = 'text-indigo-600',
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 sm:p-5',
      'animate-slide-up card-hover',
      className,
    )}>
      <div className="flex items-center sm:items-start gap-3 sm:gap-4">
        {/* Icon circle - smaller on mobile */}
        <div className={cn(
          'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0',
          'transition-transform duration-300 group-hover:scale-110',
          iconBg, iconColor,
        )}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</p>
            <Info size={12} className="text-slate-300 shrink-0 hidden sm:block" />
          </div>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-[28px] font-bold text-slate-800 leading-none tracking-tight animate-count-up">
            {value}
          </p>

          {/* Trend / subtitle row */}
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5">
            {trend !== undefined && (
              <>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold rounded-full px-1.5 py-0.5',
                  'transition-colors duration-200',
                  trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50',
                )}>
                  <TrendingUp size={10} className={cn('transition-transform', trend < 0 ? 'rotate-180' : '')} />
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">from last month</span>
              </>
            )}
            {subtitle && trend === undefined && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton version ─────────────────────────────────────── */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 sm:p-5">
      <div className="flex items-center sm:items-start gap-3 sm:gap-4">
        <div className="skeleton w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 sm:space-y-2.5 pt-0.5">
          <div className="skeleton h-3 sm:h-3.5 w-20 sm:w-24 rounded" />
          <div className="skeleton h-5 sm:h-7 w-12 sm:w-16 rounded" />
          <div className="skeleton h-2.5 sm:h-3 w-20 sm:w-28 rounded" />
        </div>
      </div>
    </div>
  );
}
