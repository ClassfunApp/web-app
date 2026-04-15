import { useState } from 'react';
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { useWallet, useWalletTransactions } from '../../hooks/queries/use-wallet';
import { StatCard } from '../../components/ui/stat-card';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Select } from '../../components/ui/select';
import { Loading } from '../../components/ui/loading';
import { Button } from '../../components/ui/button';
import { formatCurrency, formatDateTime, cn } from '../../lib/utils';
import type { WalletTransaction } from '../../types';

const PAGE_SIZE = 20;

export default function WalletPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: txData, isLoading: txLoading } = useWalletTransactions(PAGE_SIZE, page * PAGE_SIZE);

  const transactions = txData?.data ?? [];
  const total = txData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredTransactions = typeFilter
    ? transactions.filter((tx) => tx.type === typeFilter)
    : transactions;

  const columns = [
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
          {tx.type === 'credit' ? (
            <ArrowDownCircle size={12} />
          ) : tx.type === 'debit' ? (
            <ArrowUpCircle size={12} />
          ) : (
            <RefreshCw size={12} />
          )}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Wallet</h1>
      </div>

      {/* Balance card */}
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

      {/* Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Transaction History
          </h2>
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
              columns={columns}
              data={filteredTransactions as unknown as Record<string, unknown>[]}
              emptyMessage="No transactions recorded yet. Payments marked as paid will appear here."
            />
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
