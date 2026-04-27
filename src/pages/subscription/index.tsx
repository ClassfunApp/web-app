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
  const outstandingAmount = status?.outstandingInvoice?.amount ?? 0;
  const outstandingCurrency = status?.outstandingInvoice?.currency ?? '';
  const walletBalance = status?.wallet?.balance ?? 0;
  const walletCurrency = status?.wallet?.currency ?? '';
  const walletCanPay =
    !!status?.outstandingInvoice &&
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

  async function handleTogglePlan() {
    const nextPlan = status?.plan === 'monthly' ? 'annual' : 'monthly';
    await changePlan.mutateAsync(nextPlan);
  }

  const daysLeft = trialDaysLeft(status?.trialEndsAt ?? null);

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
              <Badge status={status?.plan ?? 'monthly'} label={(status?.plan ?? 'monthly').toUpperCase()} />
              <Badge status={status?.status ?? 'trial'} label={(status?.status ?? 'trial').toUpperCase()} />
            </div>

            {status?.status === 'trial' && daysLeft !== null && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial
              </p>
            )}

            {status?.plan === 'monthly' && (
              <button
                onClick={handleTogglePlan}
                disabled={changePlan.isPending}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
              >
                Upgrade to Annual — save 2 months
              </button>
            )}
            {status?.plan === 'annual' && (
              <button
                onClick={handleTogglePlan}
                disabled={changePlan.isPending}
                className="text-sm text-slate-500 dark:text-slate-400 hover:underline disabled:opacity-50"
              >
                Switch to Monthly
              </button>
            )}
          </div>

          {/* Right side */}
          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatCurrency(status?.monthlyAmount ?? 0, status?.billingCurrency)} / month
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {formatCurrency(status?.annualAmount ?? 0, status?.billingCurrency)} / year
              </p>
            </div>
            {status?.outstandingInvoice && (
              <Button
                onClick={handlePayNow}
                disabled={payMutation.isPending}
              >
                <CreditCard size={16} className="mr-2" />
                {payMutation.isPending ? 'Redirecting...' : 'Pay Now'}
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
          title="Monthly Cost"
          value={formatCurrency(status?.monthlyAmount ?? 0, status?.billingCurrency)}
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
