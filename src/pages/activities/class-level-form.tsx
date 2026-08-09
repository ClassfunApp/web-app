import { useState } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useCreateClassLevel } from '../../hooks/queries/use-activities';
import { useUsers } from '../../hooks/queries/use-users';
import { useBusinessType } from '../../hooks/use-business-type';

interface Props { open: boolean; onClose: () => void; activityId: string; }

export function ClassLevelForm({ open, onClose, activityId }: Props) {
  const [form, setForm] = useState({ name: '', capacity: '', teacherIds: [] as string[] });
  const create = useCreateClassLevel();
  const { data: users = [] } = useUsers();
  const { terms } = useBusinessType();
  const teachers = users.filter((user) =>
    user.isActive && user.roles?.some((role) => role === 'teacher' || role === 'staff'),
  );

  function toggleTeacher(id: string) {
    setForm((current) => ({
      ...current,
      teacherIds: current.teacherIds.includes(id)
        ? current.teacherIds.filter((teacherId) => teacherId !== id)
        : [...current.teacherIds, id],
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ activityId, name: form.name, capacity: form.capacity ? parseInt(form.capacity) : undefined, teacherIds: form.teacherIds });
    setForm({ name: '', capacity: '', teacherIds: [] });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add ${terms.classLevel}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={`${terms.classLevel} Name`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder={terms.classLevel === 'Subject' ? 'e.g. Mathematics' : 'e.g. Gymnastics Level 1'} />
        <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="Optional" />
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-700 dark:text-slate-300">Assigned teachers</legend>
          <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
            {teachers.length === 0 ? <p className="text-sm text-slate-500">No teachers or staff available.</p> : teachers.map((teacher) => (
              <label key={teacher.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.teacherIds.includes(teacher.id)} onChange={() => toggleTeacher(teacher.id)} />
                {teacher.fullName}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>Add {terms.classLevel}</Button>
        </div>
      </form>
    </Modal>
  );
}
