import { useState, useEffect } from 'react';
import { useCreateUser, useUpdateUser } from '../../hooks/queries/use-users';
import { useCenters } from '../../hooks/queries/use-centers';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import type { User } from '../../types';

interface StaffFormProps {
  open: boolean;
  onClose: () => void;
  editing: User | null;
}

const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'manager', label: 'Manager' },
];

export function StaffForm({ open, onClose, editing }: StaffFormProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: centers = [] } = useCenters();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
    centerId: '',
  });

  useEffect(() => {
    if (editing) {
      setForm({
        fullName: editing.fullName,
        email: editing.email,
        password: '',
        phone: editing.phone || '',
        role: editing.role,
        centerId: editing.centerId || '',
      });
    } else {
      setForm({ fullName: '', email: '', password: '', phone: '', role: 'staff', centerId: '' });
    }
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const centerId = form.centerId || undefined;

    if (editing) {
      await updateUser.mutateAsync({
        id: editing.id,
        fullName: form.fullName,
        phone: form.phone || undefined,
        role: form.role,
        centerId: centerId ?? null,
      });
    } else {
      await createUser.mutateAsync({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
        centerId,
      });
    }
    onClose();
  };

  const isManager = form.role === 'manager';
  const showCenterSelect = centers.length > 0;

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Staff Member' : 'Add Staff Member'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        {!editing && (
          <>
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </>
        )}
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          options={ROLES}
        />
        {showCenterSelect && (
          <Select
            label={isManager ? 'Assigned Center *' : 'Assigned Center'}
            value={form.centerId}
            onChange={(e) => setForm({ ...form, centerId: e.target.value })}
            options={[
              { value: '', label: isManager ? '— Select center —' : '— All centers —' },
              ...centers.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        )}
        {isManager && !form.centerId && (
          <p className="text-xs text-red-500 -mt-2">A center is required for managers.</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createUser.isPending ||
              updateUser.isPending ||
              (isManager && !form.centerId)
            }
          >
            {editing ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
