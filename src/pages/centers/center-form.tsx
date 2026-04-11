import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useCreateCenter, useUpdateCenter } from '../../hooks/queries/use-centers';
import type { Center } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  center?: Center | null;
}

export function CenterForm({ open, onClose, center }: Props) {
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const create = useCreateCenter();
  const update = useUpdateCenter();

  useEffect(() => {
    if (center) setForm({ name: center.name, address: center.address || '', phone: center.phone || '' });
    else setForm({ name: '', address: '', phone: '' });
  }, [center, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (center) {
      await update.mutateAsync({ id: center.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={center ? 'Edit Center' : 'Add Center'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <Input label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || update.isPending}>
            {center ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
