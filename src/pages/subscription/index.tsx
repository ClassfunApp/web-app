import { useState } from 'react';
import { CreditCard, Users, CalendarClock, TrendingDown, Wallet, X } from 'lucide-react';
import {
  useSubscriptionStatus,
  useSubscriptionInvoices,
  usePaySubscription,
  useChangeSubscriptionPlan,
} from '../../hooks/queries/use-subscription';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { StatCard } from '../../components/ui/stat-card';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { SubscriptionInvoice } from '../../hooks/queries/use-subscription';

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function SubscriptionPage() {
  const { data: status, isLoading: statusLoading } = useSubscriptionStatus();
  const { data: invoices, isLoading: invoicesLoading } = useSubscriptionInvoices();
  const payMutation = usePaySubscription();
  const changePlan = useChangeSubscriptionPlan();
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);

  const providerLabel = status?.paymentProvider === 'flutterwave' ? 'Flutterwave' : 'Paystack';
  const phase = status?.phase ?? status?.status ?? 'trial';
  const selectedAmount = status?.plan === 'annual' ? status?.annualAmount ?? 0 : status?.quarterlyAmount ?? 0;
  const outstandingAmount = status?.outstandingInvoice?.amount ?? selectedAmount;
  const outstandingCurrency = status?.outstandingInvoice?.currency ?? status?.billingCurrency ?? '';
  const walletBalance = status?.wallet?.balance ?? 0;
  const walletCurrency = status?.wallet?.currency ?? '';
  const walletCanPay =
    outstandingAmount > 0 &&
    walletCurrency === outstandingCurrency &&
    walletBalance >= outstandingAmount;

  function handlePayNow() {
    setMethodPickerOpen(true);
  }

  async function payWithMethod(method: 'wallet' | 'gateway') {
    setMethodPickerOpen(false);
    try {
      const result = await payMutation.mutateAsync(method);
      if (result.method === 'wallet') {
        alert('Payment successful — your subscription is now active.');
      } else {
        window.open(result.checkoutUrl, '_blank');
      }
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleSelectPlan(nextPlan: 'quarterly' | 'annual') {
    if (!status || status.plan === nextPlan) return;
    try {
      await changePlan.mutateAsync(nextPlan);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const daysLeft = status?.trialDaysRemaining ?? trialDaysLeft(status?.trialEndsAt ?? null);
  const needsPayment = phase !== 'active' || !!status?.outstandingInvoice;

  const invoiceColumns = [
    { key: 'period', header: 'Period', render: (inv: SubscriptionInvoice) => inv.billingPeriod },
    { key: 'children', header: 'Children', render: (inv: SubscriptionInvoice) => inv.childCount },
    {
      key: 'amount',
      header: 'Amount',
      render: (inv: SubscriptionInvoice) =>
        formatCurrency(Number(inv.amount), inv.currency),
    },
    { key: 'plan', header: 'Plan', render: (inv: SubscriptionInvoice) => <Badge status={inv.plan} label={inv.plan.toUpperCase()} /> },
    { key: 'status', header: 'Status', render: (inv: SubscriptionInvoice) => <Badge status={inv.status} /> },
    {
      key: 'paidAt',
      header: 'Paid At',
      render: (inv: SubscriptionInvoice) => formatDate(inv.paidAt),
    },
    {
      key: 'actions',
      header: '',
      render: (inv: SubscriptionInvoice) => (
        <div className="flex gap-1">
          {inv.status === 'pending' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMethodPickerOpen(true)}
            >
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (statusLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Subscription</h1>
      </div>

      {/* Plan Status Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left side */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge status={status?.plan ?? 'quarterly'} label={(status?.plan ?? 'quarterly').toUpperCase()} />
              <Badge status={phase === 'notice' ? 'overdue' : phase} label={(phase === 'notice' ? 'RENEWAL DUE' : phase).toUpperCase()} />
            </div>

            {phase !== 'active' && (
              <div className={`rounded-xl border p-3 text-sm ${phase === 'suspended' ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300' : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                <p className="font-semibold">
                  {phase === 'trial' && daysLeft !== null
                    ? `Trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                    : phase === 'notice'
                      ? `${status?.noticeDaysRemaining ?? 0} day${status?.noticeDaysRemaining === 1 ? '' : 's'} left to subscribe`
                      : 'Organization account suspended'}
                </p>
                <p className="mt-1 text-xs opacity-90">
                  {phase === 'suspended'
                    ? 'Scanning, grading, reports, and other organization features are paused until payment succeeds.'
                    : 'Choose quarterly or yearly billing to keep uninterrupted access. A 14-day renewal window follows the trial.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {(['quarterly', 'annual'] as const).map((plan) => {
                const selected = status?.plan === plan;
                const amount = plan === 'annual' ? status?.annualAmount ?? 0 : status?.quarterlyAmount ?? 0;
                return (
                  <button
                    key={plan}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={changePlan.isPending}
                    className={`rounded-xl border-2 p-3 text-left transition-colors disabled:opacity-50 ${selected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {plan === 'annual' ? 'Yearly' : 'Quarterly'} {selected ? '✓' : ''}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                      {formatCurrency(amount, status?.billingCurrency)} {plan === 'annual' ? '/ year' : '/ quarter'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatCurrency(status?.quarterlyAmount ?? 0, status?.billingCurrency)} / quarter
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {formatCurrency(status?.annualAmount ?? 0, status?.billingCurrency)} / year
              </p>
            </div>
            {needsPayment && (
              <Button
                onClick={handlePayNow}
                disabled={payMutation.isPending || changePlan.isPending}
              >
                <CreditCard size={16} className="mr-2" />
                {changePlan.isPending ? 'Updating plan...' : payMutation.isPending ? 'Redirecting...' : phase === 'suspended' ? 'Renew & Restore Access' : 'Subscribe Now'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Children"
          value={status?.childCount ?? 0}
          icon={<Users size={20} />}
          iconBg="bg-indigo-100 dark:bg-indigo-950"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          title="Quarterly Cost"
          value={formatCurrency(status?.quarterlyAmount ?? 0, status?.billingCurrency)}
          icon={<CreditCard size={20} />}
          iconBg="bg-emerald-100 dark:bg-emerald-950"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Annual Cost"
          value={formatCurrency(status?.annualAmount ?? 0, status?.billingCurrency)}
          icon={<TrendingDown size={20} />}
          iconBg="bg-violet-100 dark:bg-violet-950"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          title="Next Billing"
          value={status?.nextInvoice ? formatDate(status.nextInvoice.dueDate) : '—'}
          icon={<CalendarClock size={20} />}
          iconBg="bg-amber-100 dark:bg-amber-950"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Payment method picker modal */}
      {methodPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setMethodPickerOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-slate-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Choose payment method
              </h3>
              <button
                onClick={() => setMethodPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Outstanding: {formatCurrency(outstandingAmount, outstandingCurrency)}
            </p>

            <div className="space-y-3">
              <button
                disabled={!walletCanPay || payMutation.isPending}
                onClick={() => payWithMethod('wallet')}
                className="w-full text-left p-4 border rounded-lg hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-3"
              >
                <Wallet size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Wallet</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Balance: {formatCurrency(walletBalance, walletCurrency)}
                    {!walletCanPay && status?.outstandingInvoice
                      ? walletCurrency !== outstandingCurrency
                        ? ` · currency mismatch with ${outstandingCurrency}`
                        : ' · insufficient funds'
                      : ''}
                  </div>
                </div>
              </button>

              <button
                disabled={payMutation.isPending}
                onClick={() => payWithMethod('gateway')}
                className="w-full text-left p-4 border rounded-lg hover:border-indigo-500 disabled:opacity-50 flex items-start gap-3"
              >
                <CreditCard size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Card / Bank ({providerLabel})
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Opens a secure checkout powered by {providerLabel}.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Invoice History
        </h2>
        {invoicesLoading ? (
          <Loading />
        ) : (
          <Card>
            <Table
              columns={invoiceColumns}
              data={(invoices as unknown as Record<string, unknown>[]) ?? []}
              emptyMessage="No invoices yet — your first invoice will appear here when your trial ends."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
