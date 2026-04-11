import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { useCreateChild, useUpdateChild } from '../../hooks/queries/use-children';
import { useFamilies } from '../../hooks/queries/use-families';
import type { Child } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  child?: Child | null;
}

export function ChildForm({ open, onClose, child }: Props) {
  const [form, setForm] = useState({ fullName: '', dob: '', gender: '', familyId: '', medicalNotes: '', allergies: '' });
  const { data: families } = useFamilies();
  const create = useCreateChild();
  const update = useUpdateChild();

  useEffect(() => {
    if (child) setForm({ fullName: child.fullName, dob: child.dob || '', gender: child.gender || '', familyId: child.familyId || '', medicalNotes: child.medicalNotes || '', allergies: child.allergies || '' });
    else setForm({ fullName: '', dob: '', gender: '', familyId: '', medicalNotes: '', allergies: '' });
  }, [child, open]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, familyId: form.familyId || undefined, dob: form.dob || undefined, gender: form.gender || undefined, medicalNotes: form.medicalNotes || undefined, allergies: form.allergies || undefined };
    if (child) await update.mutateAsync({ id: child.id, ...data });
    else await create.mutateAsync(data);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={child ? 'Edit Child' : 'Add Child'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={form.fullName} onChange={set('fullName')} required />
          <Input label="Date of Birth" type="date" value={form.dob} onChange={set('dob')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Gender" value={form.gender} onChange={set('gender')} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
          <Select label="Family" value={form.familyId} onChange={set('familyId')} options={families?.map((f) => ({ value: f.id, label: f.familyName })) || []} />
        </div>
        <Textarea label="Medical Notes" value={form.medicalNotes} onChange={set('medicalNotes')} />
        <Textarea label="Allergies" value={form.allergies} onChange={set('allergies')} />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || update.isPending}>
            {child ? 'Save' : 'Add Child'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
