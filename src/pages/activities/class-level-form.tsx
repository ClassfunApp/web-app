import { useState } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useCreateClassLevel } from '../../hooks/queries/use-activities';

interface Props { open: boolean; onClose: () => void; activityId: string; }

export function ClassLevelForm({ open, onClose, activityId }: Props) {
  const [form, setForm] = useState({ name: '', capacity: '' });
  const create = useCreateClassLevel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ activityId, name: form.name, capacity: form.capacity ? parseInt(form.capacity) : undefined });
    setForm({ name: '', capacity: '' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Class Level" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Level Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Beginner" />
        <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="Optional" />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>Add Level</Button>
        </div>
      </form>
    </Modal>
  );
}
