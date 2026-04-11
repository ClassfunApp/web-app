import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { useCreateFamily, useUpdateFamily } from '../../hooks/queries/use-families';
import type { Family, GuardianRelationship } from '../../types';

interface Props { open: boolean; onClose: () => void; family?: Family | null; }

export function FamilyForm({ open, onClose, family }: Props) {
  const [familyName, setFamilyName] = useState('');
  const [guardian, setGuardian] = useState({ fullName: '', phone: '', email: '', relationship: 'guardian' });
  const create = useCreateFamily();
  const update = useUpdateFamily();

  useEffect(() => {
    if (family) { setFamilyName(family.familyName); }
    else { setFamilyName(''); setGuardian({ fullName: '', phone: '', email: '', relationship: 'guardian' }); }
  }, [family, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (family) {
      await update.mutateAsync({ id: family.id, familyName });
    } else {
      await create.mutateAsync({
        familyName,
        guardians: guardian.fullName ? [{ ...guardian, relationship: guardian.relationship as GuardianRelationship }] : undefined,
      });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={family ? 'Edit Family' : 'Add Family'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Family Name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
        {!family && (
          <>
            <hr className="my-2" />
            <p className="text-sm font-medium text-gray-700">Primary Guardian (optional)</p>
            <Input label="Guardian Name" value={guardian.fullName} onChange={(e) => setGuardian((g) => ({ ...g, fullName: e.target.value }))} />
            <Input label="Phone (WhatsApp)" value={guardian.phone} onChange={(e) => setGuardian((g) => ({ ...g, phone: e.target.value }))} />
            <Input label="Email" type="email" value={guardian.email} onChange={(e) => setGuardian((g) => ({ ...g, email: e.target.value }))} />
            <Select label="Relationship" value={guardian.relationship} onChange={(e) => setGuardian((g) => ({ ...g, relationship: e.target.value }))} options={[{ value: 'mother', label: 'Mother' }, { value: 'father', label: 'Father' }, { value: 'guardian', label: 'Guardian' }, { value: 'other', label: 'Other' }]} />
          </>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || update.isPending}>{family ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
