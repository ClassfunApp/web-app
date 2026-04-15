import {
  Building2,
  Baby,
  Users,
  CreditCard,
  ArrowRight,
  TrendingUp,
  BookOpen,
  School,
  GraduationCap,
  CalendarCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/queries/use-tenants';
import { usePayments } from '../hooks/queries/use-payments';
import { useBusinessType } from '../hooks/use-business-type';
import { StatCard, StatCardSkeleton } from '../components/ui/stat-card';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { VerificationBanner } from '../components/verification-banner';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../hooks/use-auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useDashboard();
  const { data: payments, isLoading: paymentsLoading } = usePayments(undefined, 'pending');
  const { isSchool, terms } = useBusinessType();

  const stats = dashboard?.stats;
  const outstandingTotal = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const currency = dashboard?.tenant.billingRegion === 'nigeria' ? 'NGN' : 'USD';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick actions tailored per business type
  const quickActions = isSchool
    ? [
        { to: '/children', label: 'Add a student', emoji: '🎒' },
        { to: '/activities', label: 'Manage classrooms', emoji: '🏫' },
        { to: '/enrollments', label: 'Enrol a student', emoji: '📋' },
        { to: '/payments', label: 'Record payment', emoji: '💳' },
        { to: '/attendance', label: 'Take attendance', emoji: '✅' },
      ]
    : [
        { to: '/children', label: 'Add a child', emoji: '👶' },
        { to: '/enrollments', label: 'New enrollment', emoji: '📋' },
        { to: '/payments', label: 'Record payment', emoji: '💳' },
        { to: '/attendance', label: 'Take attendance', emoji: '✅' },
      ];

  return (
    <div className="space-y-6 page-enter">
      <VerificationBanner />

      {/* Page heading */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {greeting()}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here's what's happening at{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {dashboard?.tenant.name ?? '…'}
            </span>
          </p>
        </div>

        {/* Business type + subscription pill */}
        {dashboard && (
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3.5 py-1.5 shadow-sm">
            {isSchool ? (
              <School size={13} className="text-emerald-500" />
            ) : (
              <GraduationCap size={13} className="text-indigo-500" />
            )}
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isSchool ? 'School' : 'Activity Center'}
            </span>
            <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">
              {dashboard.tenant.subscriptionStatus}
            </span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 stagger-children">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={terms.totalCenters}
              value={stats?.totalCenters ?? 0}
              icon={isSchool ? <School size={20} /> : <Building2 size={20} />}
              iconBg={isSchool ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-indigo-100 dark:bg-indigo-950'}
              iconColor={isSchool ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}
              trend={5}
            />
            <StatCard
              title={terms.totalChildren}
              value={stats?.totalChildren ?? 0}
              icon={isSchool ? <BookOpen size={20} /> : <Baby size={20} />}
              iconBg="bg-sky-100 dark:bg-sky-950"
              iconColor="text-sky-600 dark:text-sky-400"
              trend={12}
            />
            <StatCard
              title={terms.totalStaff}
              value={stats?.totalStaff ?? 0}
              icon={isSchool ? <GraduationCap size={20} /> : <Users size={20} />}
              iconBg="bg-violet-100 dark:bg-violet-950"
              iconColor="text-violet-600 dark:text-violet-400"
              subtitle={isSchool ? 'Teachers & admins' : 'Teachers & staff'}
            />
            <StatCard
              title="Outstanding Fees"
              value={formatCurrency(outstandingTotal, currency)}
              icon={<CreditCard size={20} />}
              iconBg="bg-amber-100 dark:bg-amber-950"
              iconColor="text-amber-600 dark:text-amber-400"
              subtitle={`${payments?.length ?? 0} pending`}
            />
          </>
        )}
      </div>

      {/* School-only: subject/classroom info banner */}
      {isSchool && !isLoading && (
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 px-5 py-4 flex items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
            <CalendarCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              School mode active
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              Activities are your classrooms, class levels are your subjects. Use the Activities page to manage your school structure.
            </p>
          </div>
          <Link
            to="/activities"
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors shrink-0 flex items-center gap-1"
          >
            Classrooms <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Pending fees */}
        <Card animate className="lg:col-span-3" style={{ animationDelay: '100ms' } as React.CSSProperties}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Outstanding Fees
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Pending & overdue payments
                </p>
              </div>
              <Link
                to="/payments"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="py-3">
            {paymentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="skeleton h-3.5 w-32 rounded" />
                    <div className="skeleton h-3.5 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : !payments?.length ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp size={18} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">No outstanding fees</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {payments.slice(0, 6).map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-3 animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                        {(p.child?.fullName ?? '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                          {p.child?.fullName || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatDate(p.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(Number(p.amount), p.currency)}
                      </span>
                      <Badge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status + quick links */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card animate style={{ animationDelay: '150ms' } as React.CSSProperties}>
            <CardHeader>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Account Status</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Type</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isSchool ? '🏫 School' : '🏃 Activity Center'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Subscription</span>
                <Badge status={dashboard?.tenant.subscriptionStatus || 'trial'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Region</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {dashboard?.tenant.billingRegion === 'nigeria' ? '🇳🇬 Nigeria' : '🌍 Overseas'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {terms.centers}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {stats?.totalCenters ?? '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card animate style={{ animationDelay: '200ms' } as React.CSSProperties}>
            <CardHeader>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-1 py-3">
              {quickActions.map(({ to, label, emoji }, i) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: `${200 + i * 40}ms` }}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {label}
                  </span>
                  <ArrowRight size={12} className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
