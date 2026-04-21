import { useState, useMemo } from 'react';
import { ShieldCheck, ShieldOff, Key, QrCode } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useUsers } from '../../hooks/queries/use-users';
import { useCenters } from '../../hooks/queries/use-centers';
import { useStaffPermissions, useGrantPermission, useRevokePermission } from '../../hooks/queries/use-staff-permissions';
import { Card } from '../../components/ui/card';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import type { User, StaffPermissionType } from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const PERMISSION_DEFS: {
  key: StaffPermissionType;
  label: string;
  short: string;
  description: string;
  Icon: typeof Key;
}[] = [
  {
    key:         'validate_pickup',
    label:       'Validate Pickup Codes',
    short:       'Pickup',
    description: 'Can verify 7-digit parent pickup codes at the gate.',
    Icon:        Key,
  },
  {
    key:         'show_center_qr',
    label:       'Show Center QR Code',
    short:       'QR Code',
    description: 'Can display the center QR for parent check-in/out scans.',
    Icon:        QrCode,
  },
];

const MANAGEABLE_ROLES = new Set(['staff', 'teacher']);

// ── Permission toggle cell ────────────────────────────────────────────────────

function PermToggle({
  userId,
  permission,
  permissionId,
  disabled,
}: {
  userId: string;
  permission: StaffPermissionType;
  permissionId: string | undefined;
  disabled: boolean;
}) {
  const grantMutation  = useGrantPermission();
  const revokeMutation = useRevokePermission();

  const granted = !!permissionId;
  const busy    = grantMutation.isPending || revokeMutation.isPending;

  async function toggle() {
    if (permissionId) {
      await revokeMutation.mutateAsync(permissionId);
    } else {
      await grantMutation.mutateAsync({ userId, permission });
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={disabled || busy}
      title={granted ? 'Revoke permission' : 'Grant permission'}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${granted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
          transition duration-200 ease-in-out
          ${granted ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const { user: me } = useAuth();
  const isOwner   = me?.roles?.includes('business_owner') ?? false;
  const isManager = me?.roles?.includes('manager') ?? false;

  const { data: centers = [] }    = useCenters();
  const { data: allUsers = [], isLoading: usersLoading } = useUsers();

  // Center selection: manager is locked to their center; owner can pick.
  const [selectedCenterId, setSelectedCenterId] = useState<string>(
    isManager && me?.centerId ? me.centerId : '',
  );

  const effectiveCenterId = isManager && me?.centerId ? me.centerId : selectedCenterId;

  const { data: permissions = [], isLoading: permsLoading } =
    useStaffPermissions(undefined, effectiveCenterId || undefined);

  // Only show staff/teachers who belong to the selected center.
  const staffInCenter = useMemo(() => {
    if (!effectiveCenterId) return allUsers.filter((u) => MANAGEABLE_ROLES.has(u.role));
    return allUsers.filter(
      (u) => MANAGEABLE_ROLES.has(u.role) && u.centerId === effectiveCenterId,
    );
  }, [allUsers, effectiveCenterId]);

  // Build a fast lookup: userId → { permission → permissionId }
  const permMap = useMemo(() => {
    const map = new Map<string, Map<StaffPermissionType, string>>();
    for (const p of permissions) {
      if (!map.has(p.userId)) map.set(p.userId, new Map());
      map.get(p.userId)!.set(p.permission, p.id);
    }
    return map;
  }, [permissions]);

  const isLoading = usersLoading || permsLoading;
  const selectedCenter = centers.find((c) => c.id === effectiveCenterId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Staff Permissions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Grant or revoke pickup and QR permissions for staff members and teachers.
          Managers and business owners always have full access.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
        <ShieldCheck size={18} className="text-indigo-500 mt-0.5 shrink-0" />
        <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-0.5">
          <p className="font-semibold">How permissions work</p>
          <p className="text-indigo-600 dark:text-indigo-400 text-xs">
            Staff and teachers need explicit permission for each operation.
            Managers (scoped to their center) and business owners are always permitted.
          </p>
        </div>
      </div>

      {/* Center picker — owner only */}
      {isOwner && !isManager && (
        <div className="max-w-xs">
          <Select
            label="Center"
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            options={[
              { value: '', label: 'All centers (no filter)' },
              ...centers.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      )}

      {/* Manager context badge */}
      {isManager && me?.centerId && selectedCenter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Showing staff for</span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            {selectedCenter.name}
          </span>
        </div>
      )}

      {/* Permissions table */}
      <Card>
        {isLoading ? (
          <Loading />
        ) : !effectiveCenterId && isOwner ? (
          <div className="py-16 text-center">
            <ShieldCheck size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Select a center</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Choose a center above to manage staff permissions.
            </p>
          </div>
        ) : staffInCenter.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldOff size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No staff in this center</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Assign staff or teachers to this center first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  {PERMISSION_DEFS.map(({ key, short, Icon }) => (
                    <th
                      key={key}
                      className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Icon size={12} />
                        {short}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffInCenter.map((u) => {
                  const userPerms = permMap.get(u.id);
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors last:border-0"
                    >
                      {/* Staff info */}
                      <td className="py-3 px-4">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {u.fullName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {u.email}
                        </p>
                        <Badge
                          status={u.role === 'teacher' ? 'active' : 'pending'}
                          className="mt-1.5"
                        >
                          {u.role}
                        </Badge>
                      </td>

                      {/* Permission toggles */}
                      {PERMISSION_DEFS.map(({ key }) => (
                        <td key={key} className="py-3 px-4 text-center">
                          <div className="flex justify-center">
                            <PermToggle
                              userId={u.id}
                              permission={key}
                              permissionId={userPerms?.get(key)}
                              disabled={!effectiveCenterId}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Permission legend */}
      <div className="grid sm:grid-cols-2 gap-4">
        {PERMISSION_DEFS.map(({ key, label, description, Icon }) => (
          <div
            key={key}
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
          >
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              <Icon size={16} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
