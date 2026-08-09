import { useState } from 'react';
import { useAttendanceRoster } from '../../hooks/queries/use-attendance';
import { useCenters } from '../../hooks/queries/use-centers';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { formatTime } from '../../lib/utils';
import type { AttendanceRosterRow } from '../../types';
import { useBusinessType } from '../../hooks/use-business-type';

export default function AttendancePage() {
  const today = new Date().toISOString().split('T')[0];
  const [centerId, setCenterId] = useState('');
  const [date, setDate] = useState(today);
  const { data: centers } = useCenters();
  const { data: attendance, isLoading } = useAttendanceRoster({ centerId: centerId || undefined, date });
  const { terms } = useBusinessType();

  const columns = [
    { key: 'child', header: terms.child, render: (a: AttendanceRosterRow) => a.childName },
    { key: 'activity', header: terms.activity, render: (a: AttendanceRosterRow) => a.activityName },
    { key: 'center', header: terms.center, render: (a: AttendanceRosterRow) => a.centerName },
    { key: 'signedInAt', header: 'Sign In', render: (a: AttendanceRosterRow) => formatTime(a.signedInAt) },
    { key: 'signedOutAt', header: 'Sign Out', render: (a: AttendanceRosterRow) => formatTime(a.signedOutAt) },
    { key: 'status', header: 'Status', render: (a: AttendanceRosterRow) => <Badge status={a.status} label={a.status === 'checked_out' ? 'ATTENDED' : a.status.toUpperCase()} /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance</h1>

      <div className="flex gap-4">
        <div className="w-64">
          <Select label={terms.center} value={centerId} onChange={(e) => setCenterId(e.target.value)} options={[{ value: '', label: `All ${terms.centers.toLowerCase()}` }, ...(centers?.map((c) => ({ value: c.id, label: c.name })) || [])]} />
        </div>
        <div className="w-48">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {isLoading ? <Loading /> : (
        <Card>
          <Table columns={columns} data={attendance as unknown as Record<string, unknown>[] || []} emptyMessage={`No enrolled ${terms.children.toLowerCase()} for this date`} />
        </Card>
      )}
    </div>
  );
}
