import { Building2, Baby, Users, CreditCard, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/queries/use-tenants';
import { usePayments } from '../hooks/queries/use-payments';
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

  const stats = dashboard?.stats;
  const outstandingTotal = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const currency = dashboard?.tenant.billingRegion === 'nigeria' ? 'NGN' : 'USD';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 page-enter">
      <VerificationBanner />

      {/* Page heading */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800">
            {greeting()}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's what's happening at{' '}
            <span className="font-medium text-slate-700">{dashboard?.tenant.name ?? '…'}</span>
          </p>
        </div>

        {/* Subscription pill */}
        {dashboard && (
          <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600 capitalize">
              {dashboard.tenant.subscriptionStatus} plan
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
              title="Total Centers"
              value={stats?.totalCenters ?? 0}
              icon={<Building2 size={20} />}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
              trend={5}
            />
            <StatCard
              title="Active Children"
              value={stats?.totalChildren ?? 0}
              icon={<Baby size={20} />}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
              trend={12}
            />
            <StatCard
              title="Staff Members"
              value={stats?.totalStaff ?? 0}
              icon={<Users size={20} />}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
              subtitle="Teachers & staff"
            />
            <StatCard
              title="Outstanding Fees"
              value={formatCurrency(outstandingTotal, currency)}
              icon={<CreditCard size={20} />}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              subtitle={`${payments?.length ?? 0} pending`}
            />
          </>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Pending fees — wider */}
        <Card animate className="lg:col-span-3" style={{ animationDelay: '100ms' } as React.CSSProperties}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Outstanding Fees</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pending & overdue payments</p>
              </div>
              <Link
                to="/payments"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
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
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No outstanding fees</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {payments.slice(0, 6).map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-3 animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {(p.child?.fullName ?? '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-700">{p.child?.fullName || 'Unknown'}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(p.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-bold text-slate-800">
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

        {/* Status + quick links — narrower */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card animate style={{ animationDelay: '150ms' } as React.CSSProperties}>
            <CardHeader>
              <h2 className="text-sm font-bold text-slate-800">Account Status</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Subscription</span>
                <Badge status={dashboard?.tenant.subscriptionStatus || 'trial'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Region</span>
                <span className="text-xs font-semibold text-slate-700">
                  {dashboard?.tenant.billingRegion === 'nigeria' ? '🇳🇬 Nigeria' : '🌍 Overseas'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Centers</span>
                <span className="text-xs font-semibold text-slate-700">{stats?.totalCenters ?? '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card animate style={{ animationDelay: '200ms' } as React.CSSProperties}>
            <CardHeader>
              <h2 className="text-sm font-bold text-slate-800">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-1 py-3">
              {[
                { to: '/children', label: 'Add a child', emoji: '👶' },
                { to: '/enrollments', label: 'New enrollment', emoji: '📋' },
                { to: '/payments', label: 'Record payment', emoji: '💳' },
                { to: '/attendance', label: 'Take attendance', emoji: '✅' },
              ].map(({ to, label, emoji }, i) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: `${200 + i * 40}ms` }}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  <span className="text-[13px] font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {label}
                  </span>
                  <ArrowRight size={12} className="ml-auto text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
