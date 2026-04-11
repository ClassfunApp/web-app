import { useState } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { useCreateFee } from '../../hooks/queries/use-payments';
import { useChildren } from '../../hooks/queries/use-children';

interface Props { open: boolean; onClose: () => void; }

export function FeeForm({ open, onClose }: Props) {
  const [form, setForm] = useState({ childId: '', description: '', amount: '', currency: 'NGN', dueDate: '' });
  const { data: children } = useChildren();
  const create = useCreateFee();

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ ...form, amount: parseFloat(form.amount) });
    setForm({ childId: '', description: '', amount: '', currency: 'NGN', dueDate: '' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Fee">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Child" value={form.childId} onChange={set('childId')} required options={children?.map((c) => ({ value: c.id, label: c.fullName })) || []} />
        <Input label="Description" value={form.description} onChange={set('description')} placeholder="e.g. Monthly subscription" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Amount" type="number" step="0.01" value={form.amount} onChange={set('amount')} required />
          <Select label="Currency" value={form.currency} onChange={set('currency')} options={[{ value: 'NGN', label: 'NGN' }, { value: 'USD', label: 'USD' }]} />
        </div>
        <Input label="Due Date" type="date" value={form.dueDate} onChange={set('dueDate')} required />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>Create Fee</Button>
        </div>
      </form>
    </Modal>
  );
}
