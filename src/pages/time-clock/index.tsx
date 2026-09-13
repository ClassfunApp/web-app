import { useEffect, useMemo, useState } from 'react';
import { Clock3, Users } from 'lucide-react';
import { useTimeEntries } from '../../hooks/queries/use-time-clock';
import { useCenters } from '../../hooks/queries/use-centers';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { StatCard } from '../../components/ui/stat-card';
import type { StaffTimeEntry } from '../../types';

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const displayTime = (value: string | null) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const duration = (entry: StaffTimeEntry) => {
  const minutes = Math.max(0, Math.floor(((entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : Date.now()) - new Date(entry.clockedInAt).getTime()) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export default function TimeClockPage() {
  const today = useMemo(() => localDateKey(new Date()), []);
  const [centerId, setCenterId] = useState('');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const { data: centers = [] } = useCenters();
  const [, tick] = useState(0);
  useEffect(() => { const timer = setInterval(() => tick((n) => n + 1), 15_000); return () => clearInterval(timer); }, []);
  const { data: entries = [], isLoading, isError, refetch } = useTimeEntries({ centerId: centerId || undefined, from, to });
  const openQuery = useTimeEntries({ centerId: centerId || undefined, status: 'open' });
  const open = openQuery.data?.length;
  const totalMinutes = entries.reduce((sum, entry) => sum + Math.max(0, Math.floor(((entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : Date.now()) - new Date(entry.clockedInAt).getTime()) / 60000)), 0);

  const columns = [
    { key: 'teacher', header: 'Teacher', render: (entry: StaffTimeEntry) => <div><div className="font-medium text-slate-900 dark:text-slate-100">{entry.user?.fullName ?? 'Teacher'}</div><div className="text-xs text-slate-500">{entry.user?.email}</div></div> },
    { key: 'center', header: 'Center', render: (entry: StaffTimeEntry) => entry.center?.name ?? '—' },
    { key: 'date', header: 'Date', render: (entry: StaffTimeEntry) => new Date(entry.clockedInAt).toLocaleDateString() },
    { key: 'in', header: 'Clock in', render: (entry: StaffTimeEntry) => displayTime(entry.clockedInAt) },
    { key: 'out', header: 'Clock out', render: (entry: StaffTimeEntry) => displayTime(entry.clockedOutAt) },
    { key: 'duration', header: 'Duration', render: (entry: StaffTimeEntry) => duration(entry) },
    { key: 'status', header: 'Status', render: (entry: StaffTimeEntry) => <Badge status={entry.clockedOutAt ? 'completed' : 'active'} label={entry.clockedOutAt ? 'CLOCKED OUT' : 'CLOCKED IN'} /> },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff time clock</h1><p className="mt-1 text-sm text-slate-500">Track teacher work sessions across your organization.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Currently clocked in" value={openQuery.isError ? 'Unavailable' : open === undefined ? 'Loading…' : String(open)} icon={<Users size={20} />} />
        <StatCard title="Hours for shifts started in period" value={isError ? 'Unavailable' : isLoading ? 'Loading…' : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} icon={<Clock3 size={20} />} />
      </div>
      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Select label="Center" value={centerId} onChange={(event) => setCenterId(event.target.value)} options={[{ value: '', label: 'All centers' }, ...centers.map((center) => ({ value: center.id, label: center.name }))]} />
          <Input label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </Card>
      {openQuery.isError ? <p role="alert">Unable to refresh open shifts. <button onClick={() => openQuery.refetch()}>Retry</button></p> : null}
      {isError ? <p role="alert">Unable to load time entries. <button onClick={() => refetch()}>Retry</button></p> : isLoading ? <Loading /> : <Card><Table columns={columns} data={entries as unknown as Record<string, unknown>[]} emptyMessage="No teacher time entries for this period" /></Card>}
    </div>
  );
}
