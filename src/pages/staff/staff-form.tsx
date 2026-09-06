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
  { value: 'parent', label: 'Parent' },
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
    roles: ['staff'],
    centerId: '',
  });

  useEffect(() => {
    if (editing) {
      setForm({
        fullName: editing.fullName,
        email: editing.email,
        password: '',
        phone: editing.phone || '',
        roles: editing.roles?.length ? editing.roles : [editing.role || 'staff'],
        centerId: editing.centerId || '',
      });
    } else {
      setForm({ fullName: '', email: '', password: '', phone: '', roles: ['staff'], centerId: '' });
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
        roles: form.roles,
        centerId: centerId ?? null,
      });
    } else {
      await createUser.mutateAsync({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        roles: form.roles,
        centerId,
      });
    }
    onClose();
  };

  const isManager = form.roles.includes('manager');
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
        <fieldset>
          <legend className="text-sm font-medium mb-2">Roles (choose up to 2)</legend>
          <div className="flex flex-wrap gap-4">
            {ROLES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.roles.includes(value)}
                  disabled={!form.roles.includes(value) && form.roles.length >= 2}
                  onChange={() => setForm((current) => ({ ...current, roles: current.roles.includes(value)
                    ? current.roles.length > 1 ? current.roles.filter((role) => role !== value) : current.roles
                    : [...current.roles, value] }))} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
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
