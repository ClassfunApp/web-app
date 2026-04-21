import { useState } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useUsers, useUpdateUser } from '../../hooks/queries/use-users';
import { useCenters } from '../../hooks/queries/use-centers';
import { useStaffPermissions, useGrantPermission, useRevokePermission } from '../../hooks/queries/use-staff-permissions';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Loading } from '../../components/ui/loading';
import { StaffForm } from './staff-form';
import { formatDate } from '../../lib/utils';
import type { User, StaffPermissionType } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_STATUS: Record<string, string> = {
  business_owner: 'paid',
  manager:        'submitted',
  teacher:        'active',
  staff:          'pending',
};

const PERMISSION_LABELS: Record<StaffPermissionType, { label: string; description: string }> = {
  validate_pickup: {
    label:       'Validate Pickup Codes',
    description: 'Allow this staff member to validate 7-digit pickup codes from parents.',
  },
  show_center_qr: {
    label:       'Show Center QR Code',
    description: 'Allow this staff member to display the center QR code for parent check-in/out.',
  },
};

const ALL_PERMISSIONS: StaffPermissionType[] = ['validate_pickup', 'show_center_qr'];

// ── Permissions modal ─────────────────────────────────────────────────────────

function PermissionsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { data: permissions = [], isLoading } = useStaffPermissions(user.id);
  const grantMutation  = useGrantPermission();
  const revokeMutation = useRevokePermission();

  const grantedSet = new Set(permissions.map((p) => p.permission));

  async function toggle(permission: StaffPermissionType) {
    const existing = permissions.find((p) => p.permission === permission);
    if (existing) {
      await revokeMutation.mutateAsync(existing.id);
    } else {
      await grantMutation.mutateAsync({ userId: user.id, permission });
    }
  }

  const isBusy = grantMutation.isPending || revokeMutation.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Permissions — ${user.fullName}`}
      size="md"
    >
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Managers and business owners always have full access. Toggle permissions below
        for staff members and teachers.
      </p>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {ALL_PERMISSIONS.map((perm) => {
            const granted = grantedSet.has(perm);
            const cfg = PERMISSION_LABELS[perm];
            return (
              <div
                key={perm}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${granted ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {granted
                      ? <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                      : <ShieldOff   size={16} className="text-slate-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cfg.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cfg.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggle(perm)}
                  disabled={isBusy}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    granted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      granted ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const { data: users, isLoading } = useUsers();
  const { data: centers = [] }     = useCenters();
  const updateUser = useUpdateUser();

  const [formOpen, setFormOpen]           = useState(false);
  const [editing, setEditing]             = useState<User | null>(null);
  const [permTarget, setPermTarget]       = useState<User | null>(null);

  const centerName = (centerId: string | null) => {
    if (!centerId) return '—';
    return centers.find((c) => c.id === centerId)?.name ?? '—';
  };

  /** Only staff and teachers can have per-center permissions; owners/managers are always permitted. */
  const canManagePermissions = (u: User) =>
    u.role === 'staff' || u.role === 'teacher';

  const columns = [
    { key: 'fullName', header: 'Name',  render: (u: User) => u.fullName },
    { key: 'email',    header: 'Email', render: (u: User) => u.email },
    { key: 'phone',    header: 'Phone', render: (u: User) => u.phone || '—' },
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
        <div className="flex gap-1 items-center">
          {canManagePermissions(u) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPermTarget(u)}
              title="Manage permissions"
            >
              <ShieldCheck size={14} className="text-indigo-500" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setEditing(u); setFormOpen(true); }}
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage staff, teachers, and their center permissions.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-2" /> Add Staff
        </Button>
      </div>

      {/* Permission legend */}
      <div className="flex flex-wrap gap-3">
        {ALL_PERMISSIONS.map((p) => (
          <div key={p} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck size={12} className="text-indigo-400" />
            <span>{PERMISSION_LABELS[p].label}</span>
          </div>
        ))}
        <span className="text-xs text-slate-400 ml-1">— click <ShieldCheck size={11} className="inline text-indigo-500" /> on a staff / teacher row to manage</span>
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
        onClose={() => { setFormOpen(false); setEditing(null); }}
        editing={editing}
      />

      {permTarget && (
        <PermissionsModal user={permTarget} onClose={() => setPermTarget(null)} />
      )}
    </div>
  );
}
