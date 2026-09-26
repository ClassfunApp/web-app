import { useState } from 'react';
import { useAttendanceRoster } from '../../hooks/queries/use-attendance';
import { useCenters } from '../../hooks/queries/use-centers';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Select } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { formatTime } from '../../lib/utils';
import type { AttendanceRosterRow } from '../../types';
import { useBusinessType } from '../../hooks/use-business-type';

export default function AttendancePage() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [centerId, setCenterId] = useState('');
  const [date, setDate] = useState(today);
  const { data: centers } = useCenters();
  const { data: attendance, isLoading } = useAttendanceRoster({ centerId: centerId || undefined, date });
  const { terms } = useBusinessType();
  const rows = attendance ?? [];
  const present = rows.filter((row) => row.status === 'present').length;
  const checkedOut = rows.filter((row) => row.status === 'checked_out').length;
  const absent = rows.filter((row) => row.status === 'absent').length;

  const statusStyles = {
    present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    checked_out: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    absent: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  };
  const statusLabels = { present: 'PRESENT', checked_out: 'OUT', absent: 'ABSENT' };

  const columns = [
    { key: 'child', header: terms.child, render: (a: AttendanceRosterRow) => a.childName },
    { key: 'activity', header: terms.activity, render: (a: AttendanceRosterRow) => a.activityName },
    { key: 'center', header: terms.center, render: (a: AttendanceRosterRow) => a.centerName },
    { key: 'signedInAt', header: 'Sign In', render: (a: AttendanceRosterRow) => formatTime(a.signedInAt) },
    { key: 'signedOutAt', header: 'Sign Out', render: (a: AttendanceRosterRow) => formatTime(a.signedOutAt) },
    { key: 'status', header: 'Status', render: (a: AttendanceRosterRow) => (
      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold leading-none ${statusStyles[a.status]}`}>
        {statusLabels[a.status]}
      </span>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance</h1>
        {!isLoading && (
          <div className="text-right" aria-label={`${present + checkedOut} of ${rows.length} attended`}>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{present + checkedOut}/{rows.length}</div>
            <div className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">ATTENDED</div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <div className="w-64">
          <Select label={terms.center} value={centerId} onChange={(e) => setCenterId(e.target.value)} options={[{ value: '', label: `All ${terms.centers.toLowerCase()}` }, ...(centers?.map((c) => ({ value: c.id, label: c.name })) || [])]} />
        </div>
        <div className="w-48">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {isLoading ? <Loading /> : (
        <>
          <div className="grid grid-cols-3 gap-3" aria-label="Attendance summary">
            {[
              { label: 'PRESENT', count: present, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'CHECKED OUT', count: checkedOut, color: 'text-violet-600 dark:text-violet-400' },
              { label: 'ABSENT', count: absent, color: 'text-red-600 dark:text-red-400' },
            ].map(({ label, count, color }) => (
              <Card key={label} className="px-2 py-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{String(count).padStart(2, '0')}</div>
                <div className="mt-1 text-[10px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
              </Card>
            ))}
          </div>
          <Card>
            <Table columns={columns} data={rows as unknown as Record<string, unknown>[]} emptyMessage={`No enrolled ${terms.children.toLowerCase()} for this date`} />
          </Card>
        </>
      )}
    </div>
  );
}
