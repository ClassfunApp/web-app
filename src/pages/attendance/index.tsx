import { useState } from 'react';
import { useAttendance } from '../../hooks/queries/use-attendance';
import { useCenters } from '../../hooks/queries/use-centers';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { formatTime } from '../../lib/utils';
import type { Attendance } from '../../types';

export default function AttendancePage() {
  const today = new Date().toISOString().split('T')[0];
  const [centerId, setCenterId] = useState('');
  const [date, setDate] = useState(today);
  const { data: centers } = useCenters();
  const { data: attendance, isLoading } = useAttendance({ centerId: centerId || undefined, date });

  const columns = [
    { key: 'child', header: 'Child', render: (a: Attendance) => a.enrollment?.child?.fullName || '—' },
    { key: 'activity', header: 'Activity', render: (a: Attendance) => a.enrollment?.activity?.name || '—' },
    { key: 'center', header: 'Center', render: (a: Attendance) => a.center?.name || '—' },
    { key: 'signedInAt', header: 'Sign In', render: (a: Attendance) => formatTime(a.signedInAt) },
    { key: 'signedOutAt', header: 'Sign Out', render: (a: Attendance) => formatTime(a.signedOutAt) },
    { key: 'method', header: 'Method', render: (a: Attendance) => <Badge status={a.method} label={a.method.toUpperCase()} /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>

      <div className="flex gap-4">
        <div className="w-64">
          <Select label="Center" value={centerId} onChange={(e) => setCenterId(e.target.value)} options={centers?.map((c) => ({ value: c.id, label: c.name })) || []} />
        </div>
        <div className="w-48">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {isLoading ? <Loading /> : (
        <Card>
          <Table columns={columns} data={attendance as unknown as Record<string, unknown>[] || []} emptyMessage="No attendance records for this date" />
        </Card>
      )}
    </div>
  );
}
