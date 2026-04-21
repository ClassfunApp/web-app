import { useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Plus,
  Trash2,
  Star,
  CreditCard,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  useWallet,
  useWalletTransactions,
  useBeneficiaries,
  useAddBeneficiary,
  useDeleteBeneficiary,
  useSetDefaultBeneficiary,
  useWithdrawals,
  useWithdraw,
  useBanks,
} from '../../hooks/queries/use-wallet';
import { StatCard } from '../../components/ui/stat-card';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Select } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { formatCurrency, formatDateTime, cn } from '../../lib/utils';
import type { WalletTransaction, BankBeneficiary, Withdrawal, WithdrawalStatus } from '../../types';

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const map: Record<WithdrawalStatus, { label: string; className: string; Icon: typeof Clock }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300', Icon: Clock },
    processing: { label: 'Processing', className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300', Icon: RefreshCw },
    success: { label: 'Success', className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400', Icon: CheckCircle2 },
    failed: { label: 'Failed', className: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400', Icon: XCircle },
    reversed: { label: 'Reversed', className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', Icon: ArrowRightLeft },
  };
  const { label, className, Icon } = map[status] ?? map.pending;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1', className)}>
      <Icon size={11} />
      {label}
    </span>
  );
}

// ── Add Beneficiary Modal ─────────────────────────────────────────────────────

function AddBeneficiaryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: banks = [] } = useBanks();
  const addMutation = useAddBeneficiary();

  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setAccountNumber('');
    setBankCode('');
    setIsDefault(false);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!accountNumber.trim() || accountNumber.length < 10) {
      setError('Enter a valid 10-digit account number.');
      return;
    }
    if (!bankCode) {
      setError('Select a bank.');
      return;
    }
    const selectedBank = banks.find((b) => b.code === bankCode);
    try {
      await addMutation.mutateAsync({
        accountNumber: accountNumber.trim(),
        bankCode,
        bankName: selectedBank?.name ?? bankCode,
        isDefault,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add beneficiary.';
      // Extract server error message if available
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMsg ?? msg);
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Add Bank Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The account name will be verified automatically via Paystack before saving.
        </p>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">Bank</label>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
          >
            <option value="">Select a bank…</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>

        <Input
          label="Account Number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="0123456789"
          maxLength={10}
          inputMode="numeric"
        />

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Set as default account</span>
        </label>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Verifying…' : 'Save Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Withdraw Modal ────────────────────────────────────────────────────────────

function WithdrawModal({
  open,
  onClose,
  walletBalance,
  walletCurrency,
}: {
  open: boolean;
  onClose: () => void;
  walletBalance: number;
  walletCurrency: string;
}) {
  const { data: beneficiaries = [] } = useBeneficiaries();
  const withdrawMutation = useWithdraw();

  const defaultBeneficiary = beneficiaries.find((b) => b.isDefault);

  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary?.id ?? '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Keep default selected when list loads
  function handleOpen() {
    if (!beneficiaryId && defaultBeneficiary) setBeneficiaryId(defaultBeneficiary.id);
  }

  function reset() {
    setBeneficiaryId(defaultBeneficiary?.id ?? '');
    setAmount('');
    setReason('');
    setError('');
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const parsedAmount = parseFloat(amount);
    if (!beneficiaryId) { setError('Select a bank account.'); return; }
    if (!parsedAmount || parsedAmount < 1000) { setError('Minimum withdrawal is ₦1,000.'); return; }
    if (parsedAmount > walletBalance) { setError('Amount exceeds wallet balance.'); return; }

    try {
      await withdrawMutation.mutateAsync({ beneficiaryId, amount: parsedAmount, reason: reason || undefined });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMsg ?? 'Withdrawal failed. Please try again.');
    }
  }

  if (success) {
    return (
      <Modal open={open} onClose={() => { reset(); onClose(); }} title="Withdrawal Initiated">
        <div className="text-center py-4 space-y-3">
          <CheckCircle2 size={48} className="mx-auto text-green-500" />
          <p className="text-slate-700 dark:text-slate-300 text-sm">
            Your withdrawal is being processed. Funds typically arrive within minutes.
          </p>
          <Button className="w-full mt-2" onClick={() => { reset(); onClose(); }}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Withdraw Funds" size="md">
      <form onSubmit={(e) => { handleOpen(); handleSubmit(e); }} className="space-y-4">
        {/* Balance */}
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-4 py-3 text-center">
          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wide">Available Balance</p>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
            {formatCurrency(walletBalance, walletCurrency)}
          </p>
        </div>

        {/* Beneficiary selector */}
        {beneficiaries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No bank accounts saved. Add one in the <strong>Bank Accounts</strong> section below.
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
              Destination Account
            </label>
            <div className="space-y-2">
              {beneficiaries.map((b) => (
                <label
                  key={b.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all',
                    beneficiaryId === b.id
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300',
                  )}
                >
                  <input
                    type="radio"
                    name="beneficiary"
                    value={b.id}
                    checked={beneficiaryId === b.id}
                    onChange={() => setBeneficiaryId(b.id)}
                    className="accent-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{b.accountName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{b.bankName} · ****{b.accountNumber.slice(-4)}</p>
                  </div>
                  {b.isDefault && (
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">Default</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        <Input
          label="Amount (NGN)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount (min ₦1,000)"
          min="1000"
          step="1"
        />

        <Input
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Operational expenses"
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={withdrawMutation.isPending || beneficiaries.length === 0}
          >
            {withdrawMutation.isPending ? 'Processing…' : 'Withdraw'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: txData, isLoading: txLoading } = useWalletTransactions(PAGE_SIZE, page * PAGE_SIZE);
  const { data: beneficiaries = [], isLoading: benLoading } = useBeneficiaries();
  const { data: withdrawalsData } = useWithdrawals(10, 0);

  const deleteMutation = useDeleteBeneficiary();
  const setDefaultMutation = useSetDefaultBeneficiary();

  const transactions = txData?.data ?? [];
  const total = txData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filteredTransactions = typeFilter ? transactions.filter((tx) => tx.type === typeFilter) : transactions;

  const withdrawals = withdrawalsData?.data ?? [];

  // ── Transaction table columns ──

  const txColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (tx: WalletTransaction) => (
        <span className="text-slate-600 dark:text-slate-400 text-xs">{formatDateTime(tx.createdAt)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (tx: WalletTransaction) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1',
            tx.type === 'credit'
              ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
              : tx.type === 'debit'
              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
          )}
        >
          {tx.type === 'credit' ? <ArrowDownCircle size={12} /> : tx.type === 'debit' ? <ArrowUpCircle size={12} /> : <RefreshCw size={12} />}
          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (tx: WalletTransaction) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">{tx.description}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx: WalletTransaction) => (
        <span
          className={cn(
            'font-semibold text-sm',
            tx.type === 'credit'
              ? 'text-green-600 dark:text-green-400'
              : tx.type === 'debit'
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-600 dark:text-slate-400',
          )}
        >
          {tx.type === 'credit' ? '+' : tx.type === 'debit' ? '-' : ''}
          {formatCurrency(Number(tx.amount), tx.currency)}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      render: (tx: WalletTransaction) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">
          {formatCurrency(Number(tx.balanceAfter), tx.currency)}
        </span>
      ),
    },
  ];

  // ── Withdrawal history columns ──

  const withdrawalColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (w: Withdrawal) => (
        <span className="text-slate-600 dark:text-slate-400 text-xs">{formatDateTime(w.createdAt)}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (w: Withdrawal) => (
        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
          {formatCurrency(Number(w.amount), w.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (w: Withdrawal) => <WithdrawalStatusBadge status={w.status} />,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (w: Withdrawal) => (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {w.paystackReference ?? '—'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Note',
      render: (w: Withdrawal) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">{w.reason ?? '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Wallet</h1>
        <Button onClick={() => setShowWithdrawModal(true)} disabled={!wallet || Number(wallet.balance) <= 0}>
          <ArrowUpCircle size={16} className="mr-1.5" />
          Withdraw
        </Button>
      </div>

      {/* Balance cards */}
      {walletLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Current Balance"
            value={wallet ? formatCurrency(Number(wallet.balance), wallet.currency) : '—'}
            icon={<WalletIcon size={20} />}
            subtitle="Total collected from payments"
            iconBg="bg-indigo-100 dark:bg-indigo-950"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
          <StatCard
            title="Total Transactions"
            value={total}
            icon={<RefreshCw size={20} />}
            subtitle="All recorded transactions"
            iconBg="bg-slate-100 dark:bg-slate-800"
            iconColor="text-slate-600 dark:text-slate-400"
          />
          <StatCard
            title="Currency"
            value={wallet?.currency ?? '—'}
            icon={<ArrowDownCircle size={20} />}
            subtitle="Primary wallet currency"
            iconBg="bg-green-100 dark:bg-green-950"
            iconColor="text-green-600 dark:text-green-400"
          />
        </div>
      )}

      {/* ── Bank Accounts ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Bank Accounts</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Saved accounts for withdrawals</p>
          </div>
          <Button size="sm" onClick={() => setShowAddBeneficiaryModal(true)}>
            <Plus size={14} className="mr-1" />
            Add Account
          </Button>
        </div>

        {benLoading ? (
          <Loading />
        ) : beneficiaries.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <CreditCard size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No bank accounts saved yet.</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => setShowAddBeneficiaryModal(true)}>
                Add your first account
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {beneficiaries.map((b: BankBeneficiary) => (
              <div
                key={b.id}
                className={cn(
                  'rounded-2xl border px-5 py-4 flex items-center gap-4',
                  b.isDefault
                    ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <CreditCard size={18} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{b.accountName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{b.bankName} · ****{b.accountNumber.slice(-4)}</p>
                  {b.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      <Star size={10} fill="currentColor" /> Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!b.isDefault && (
                    <button
                      onClick={() => setDefaultMutation.mutate(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                      title="Set as default"
                    >
                      <Star size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${b.accountName} (${b.bankName})?`)) {
                        deleteMutation.mutate(b.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    title="Remove account"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Withdrawal History ── */}
      {withdrawals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Withdrawal History</h2>
          <Card>
            <Table
              columns={withdrawalColumns}
              data={withdrawals as unknown as Record<string, unknown>[]}
              emptyMessage="No withdrawals yet."
            />
          </Card>
        </div>
      )}

      {/* ── Transaction History ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Transaction History</h2>
          <div className="w-44">
            <Select
              label=""
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              options={[
                { value: '', label: 'All Types' },
                { value: 'credit', label: 'Credits' },
                { value: 'debit', label: 'Debits' },
                { value: 'adjustment', label: 'Adjustments' },
              ]}
            />
          </div>
        </div>

        {txLoading ? (
          <Loading />
        ) : (
          <Card>
            <Table
              columns={txColumns}
              data={filteredTransactions as unknown as Record<string, unknown>[]}
              emptyMessage="No transactions recorded yet. Payments marked as paid will appear here."
            />
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AddBeneficiaryModal open={showAddBeneficiaryModal} onClose={() => setShowAddBeneficiaryModal(false)} />
      {wallet && (
        <WithdrawModal
          open={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          walletBalance={Number(wallet.balance)}
          walletCurrency={wallet.currency}
        />
      )}
    </div>
  );
}
