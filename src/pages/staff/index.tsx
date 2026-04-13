import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useUsers, useUpdateUser } from '../../hooks/queries/use-users';
import { useCenters } from '../../hooks/queries/use-centers';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { StaffForm } from './staff-form';
import { formatDate } from '../../lib/utils';
import type { User } from '../../types';

const ROLE_STATUS: Record<string, string> = {
  business_owner: 'paid',
  manager: 'submitted',
  teacher: 'active',
  staff: 'pending',
};

export default function StaffPage() {
  const { data: users, isLoading } = useUsers();
  const { data: centers = [] } = useCenters();
  const updateUser = useUpdateUser();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const centerName = (centerId: string | null) => {
    if (!centerId) return '—';
    return centers.find((c) => c.id === centerId)?.name ?? '—';
  };

  const columns = [
    { key: 'fullName', header: 'Name', render: (u: User) => u.fullName },
    { key: 'email', header: 'Email', render: (u: User) => u.email },
    { key: 'phone', header: 'Phone', render: (u: User) => u.phone || '—' },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => (
        <Badge status={ROLE_STATUS[u.role] ?? 'pending'}>
          {u.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'center',
      header: 'Center',
      render: (u: User) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">{centerName(u.centerId)}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (u: User) => (
        <Badge status={u.isActive ? 'active' : 'overdue'}>
          {u.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Joined', render: (u: User) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (u: User) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(u);
              setFormOpen(true);
            }}
          >
            <Edit2 size={14} />
          </Button>
          {u.isActive ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm('Deactivate this staff member?'))
                  updateUser.mutate({ id: u.id, isActive: false });
              }}
            >
              <Trash2 size={14} className="text-red-500" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateUser.mutate({ id: u.id, isActive: true })}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff Management</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" /> Add Staff
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <Card>
          <Table
            columns={columns}
            data={(users as unknown as Record<string, unknown>[]) || []}
            emptyMessage="No staff members found"
          />
        </Card>
      )}

      <StaffForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />
    </div>
  );
}
