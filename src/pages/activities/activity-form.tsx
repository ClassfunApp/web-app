import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { useCreateActivity, useUpdateActivity } from '../../hooks/queries/use-activities';
import { useCenters } from '../../hooks/queries/use-centers';
import type { Activity } from '../../types';

interface Props { open: boolean; onClose: () => void; activity?: Activity | null; }

export function ActivityForm({ open, onClose, activity }: Props) {
  const [form, setForm] = useState({ name: '', centerId: '', description: '', feeAmount: '', feeCurrency: 'NGN' });
  const { data: centers } = useCenters();
  const create = useCreateActivity();
  const update = useUpdateActivity();

  useEffect(() => {
    if (activity) setForm({ name: activity.name, centerId: activity.centerId, description: activity.description || '', feeAmount: String(activity.feeAmount), feeCurrency: activity.feeCurrency });
    else setForm({ name: '', centerId: '', description: '', feeAmount: '', feeCurrency: 'NGN' });
  }, [activity, open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, feeAmount: parseFloat(form.feeAmount) || 0 };
    if (activity) await update.mutateAsync({ id: activity.id, ...data });
    else await create.mutateAsync(data);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={activity ? 'Edit Activity' : 'Add Activity'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={set('name')} required />
        <Select label="Center" value={form.centerId} onChange={set('centerId')} required options={centers?.map((c) => ({ value: c.id, label: c.name })) || []} />
        <Textarea label="Description" value={form.description} onChange={set('description')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fee Amount" type="number" step="0.01" value={form.feeAmount} onChange={set('feeAmount')} />
          <Select label="Currency" value={form.feeCurrency} onChange={set('feeCurrency')} options={[{ value: 'NGN', label: 'NGN' }, { value: 'USD', label: 'USD' }]} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || update.isPending}>{activity ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
