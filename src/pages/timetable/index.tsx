import { useMemo, useState } from 'react';
import { CalendarDays, Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import { useTimetable, useSaveTimetableEntry, useDeleteTimetableEntry } from '../../hooks/queries/use-timetable';
import { useCenters } from '../../hooks/queries/use-centers';
import { useActivities } from '../../hooks/queries/use-activities';
import { useUsers } from '../../hooks/queries/use-users';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Modal } from '../../components/ui/modal';
import { Loading } from '../../components/ui/loading';
import type { TimetableEntry } from '../../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function TimetableForm({ entry, centerId, close }: { entry: TimetableEntry | null; centerId: string; close: () => void }) {
  const { data: activities = [] } = useActivities(centerId);
  const { data: users = [] } = useUsers();
  const save = useSaveTimetableEntry();
  const [activityId, setActivityId] = useState(entry?.activityId ?? '');
  const [classLevelId, setClassLevelId] = useState(entry?.classLevelId ?? '');
  const [teacherIds, setTeacherIds] = useState<string[]>(entry?.teacherIds?.length ? entry.teacherIds : entry?.teacherId ? [entry.teacherId] : []);
  const [dayOfWeek, setDay] = useState(entry?.dayOfWeek ?? 1);
  const [startTime, setStart] = useState(entry?.startTime.slice(0, 5) ?? '08:00');
  const [endTime, setEnd] = useState(entry?.endTime.slice(0, 5) ?? '09:00');
  const [room, setRoom] = useState(entry?.room ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [error, setError] = useState('');
  const levels = activities.find((a) => a.id === activityId)?.classLevels ?? [];
  const teachers = users.filter((u) => u.isActive && u.roles?.some((r) => r === 'teacher' || r === 'staff'));
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); try { await save.mutateAsync({ id: entry?.id, centerId, activityId, classLevelId: classLevelId || null, teacherIds, dayOfWeek, startTime, endTime, room: room || null, notes: notes || null }); close(); } catch (e: unknown) { const err = e as { response?: { data?: { message?: string } }; message?: string }; setError(err.response?.data?.message ?? err.message ?? 'Could not save lesson'); } }
  return <form onSubmit={submit} className="space-y-4">
    <Select label="Subject / activity" value={activityId} onChange={(e) => { setActivityId(e.target.value); setClassLevelId(''); }} options={[{ value: '', label: 'Select subject…' }, ...activities.map((a) => ({ value: a.id, label: a.name }))]} />
    <Select label="Class / level" value={classLevelId} onChange={(e) => setClassLevelId(e.target.value)} options={[{ value: '', label: 'Whole subject' }, ...levels.map((l) => ({ value: l.id, label: l.name }))]} />
    <fieldset><legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Teachers</legend><div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">{teachers.map((u) => <label key={u.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={teacherIds.includes(u.id)} onChange={() => setTeacherIds((ids) => ids.includes(u.id) ? ids.filter((id) => id !== u.id) : [...ids, u.id])} />{u.fullName}</label>)}{!teachers.length && <p className="text-sm text-slate-500">No teachers available</p>}</div></fieldset>
    <Select label="Day" value={String(dayOfWeek)} onChange={(e) => setDay(Number(e.target.value))} options={DAYS.map((d, i) => ({ value: String(i + 1), label: d }))} />
    <div className="grid grid-cols-2 gap-3"><Input label="Starts" type="time" value={startTime} onChange={(e) => setStart(e.target.value)} /><Input label="Ends" type="time" value={endTime} onChange={(e) => setEnd(e.target.value)} /></div>
    <Input label="Room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Room 4 or Science Lab" />
    <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional lesson note" />
    {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    <div className="flex gap-3"><Button type="button" variant="secondary" className="flex-1" onClick={close}>Cancel</Button><Button type="submit" className="flex-1" disabled={!activityId || save.isPending}>{save.isPending ? 'Saving…' : 'Save lesson'}</Button></div>
  </form>;
}

export default function TimetablePage() {
  const { data: centers = [] } = useCenters(); const [centerId, setCenterId] = useState('');
  const selectedCenter = centerId || centers[0]?.id || '';
  const { data: entries = [], isLoading } = useTimetable(selectedCenter);
  const remove = useDeleteTimetableEntry(); const [editing, setEditing] = useState<TimetableEntry | null | undefined>(undefined);
  const grouped = useMemo(() => DAYS.map((_, i) => entries.filter((e) => e.dayOfWeek === i + 1)), [entries]);
  return <div className="space-y-6 print:p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white"><CalendarDays className="text-indigo-600" /> School Timetable</h1><p className="mt-1 text-sm text-slate-500">Plan lessons by day, time, class, teacher and room. Conflicts are blocked automatically.</p></div><div className="flex gap-2 print:hidden"><Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print</Button><Button onClick={() => setEditing(null)} disabled={!selectedCenter}><Plus size={16} /> Add lesson</Button></div></div>
    {centers.length > 1 && <div className="max-w-sm print:hidden"><Select label="Campus" value={selectedCenter} onChange={(e) => setCenterId(e.target.value)} options={centers.map((c) => ({ value: c.id, label: c.name }))} /></div>}
    {isLoading ? <Loading /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{DAYS.map((day, index) => <Card key={day} className="min-w-0"><h2 className="mb-3 font-bold text-slate-800 dark:text-slate-100">{day}</h2><div className="space-y-2">{grouped[index].map((entry) => <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><p className="text-xs font-bold text-indigo-600">{entry.startTime.slice(0, 5)}–{entry.endTime.slice(0, 5)}</p><p className="mt-1 font-semibold text-slate-800 dark:text-white">{entry.activity?.name}</p><p className="text-xs text-slate-500">{entry.classLevel?.name ?? 'All classes'} · {entry.room || 'Room TBA'}</p><p className="text-xs text-slate-500">{entry.teachers?.length ? entry.teachers.map((teacher) => teacher.fullName).join(', ') : entry.teacher?.fullName ?? 'Teacher TBA'}</p><div className="mt-2 flex justify-end gap-1 print:hidden"><button aria-label="Edit" className="p-1 text-slate-400 hover:text-indigo-600" onClick={() => setEditing(entry)}><Pencil size={14} /></button><button aria-label="Delete" className="p-1 text-slate-400 hover:text-red-600" onClick={() => { if (confirm('Delete this lesson?')) remove.mutate(entry.id); }}><Trash2 size={14} /></button></div></div>)}{!grouped[index].length && <p className="py-6 text-center text-xs text-slate-400">No lessons</p>}</div></Card>)}</div>}
    <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Edit lesson' : 'Add lesson'}>{selectedCenter && <TimetableForm key={editing?.id ?? 'new'} entry={editing ?? null} centerId={selectedCenter} close={() => setEditing(undefined)} />}</Modal>
  </div>;
}
