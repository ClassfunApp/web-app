import { useState } from 'react';
import { Plus, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { usePayments, useGeneratePaymentLink, useMarkAsPaid } from '../../hooks/queries/use-payments';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { Loading } from '../../components/ui/loading';
import { FeeForm } from './fee-form';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { FeePayment } from '../../types';

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: payments, isLoading } = usePayments(undefined, statusFilter || undefined);
  const generateLink = useGeneratePaymentLink();
  const markPaid = useMarkAsPaid();
  const [formOpen, setFormOpen] = useState(false);

  const columns = [
    { key: 'child', header: 'Child', render: (p: FeePayment) => p.child?.fullName || '—' },
    { key: 'description', header: 'Description', render: (p: FeePayment) => p.description || '—' },
    { key: 'amount', header: 'Amount', render: (p: FeePayment) => formatCurrency(Number(p.amount), p.currency) },
    { key: 'dueDate', header: 'Due Date', render: (p: FeePayment) => formatDate(p.dueDate) },
    { key: 'status', header: 'Status', render: (p: FeePayment) => <Badge status={p.status} /> },
    { key: 'actions', header: '', render: (p: FeePayment) => (
      <div className="flex gap-1">
        {p.status !== 'paid' && (
          <>
            <Button size="sm" variant="ghost" onClick={async () => {
              const res = await generateLink.mutateAsync({ feePaymentId: p.id });
              window.open(res.paymentLink, '_blank');
            }}><LinkIcon size={14} className="mr-1" /> Pay Link</Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm('Mark as paid?')) markPaid.mutate(p.id); }}>
              <CheckCircle size={14} className="mr-1" /> Paid
            </Button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payments & Fees</h1>
        <Button onClick={() => setFormOpen(true)}><Plus size={16} className="mr-2" /> Create Fee</Button>
      </div>

      <div className="w-48">
        <Select label="Filter by Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }]} />
      </div>

      {isLoading ? <Loading /> : (
        <Card>
          <Table columns={columns} data={payments as unknown as Record<string, unknown>[] || []} emptyMessage="No payments found" />
        </Card>
      )}

      <FeeForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
