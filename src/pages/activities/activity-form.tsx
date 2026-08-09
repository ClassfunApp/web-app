import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { useCreateActivity, useUpdateActivity } from '../../hooks/queries/use-activities';
import { useCenters } from '../../hooks/queries/use-centers';
import type { Activity } from '../../types';
import { useUsers } from '../../hooks/queries/use-users';
import { useBusinessType } from '../../hooks/use-business-type';

interface Props { open: boolean; onClose: () => void; activity?: Activity | null; }

const EMPTY_FORM = { name: '', centerId: '', description: '', feeAmount: '', feeCurrency: 'NGN', startTime: '', endTime: '', teacherIds: [] as string[] };

export function ActivityForm({ open, onClose, activity }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const { data: centers } = useCenters();
  const { data: users = [] } = useUsers();
  const { terms } = useBusinessType();
  const create = useCreateActivity();
  const update = useUpdateActivity();

  useEffect(() => {
    if (activity) {
      setForm({
        name: activity.name,
        centerId: activity.centerId,
        description: activity.description || '',
        feeAmount: String(activity.feeAmount),
        feeCurrency: activity.feeCurrency,
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        teacherIds: [...(activity.teacherIds || [])],
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [activity, open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [f]: e.target.value }));

  const teachers = users.filter((user) =>
    user.isActive &&
    user.roles?.some((role) => role === 'teacher' || role === 'staff') &&
    (!form.centerId || !user.centerId || user.centerId === form.centerId),
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
    const data = {
      ...form,
      feeAmount: parseFloat(form.feeAmount) || 0,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
    };
    if (activity) await update.mutateAsync({ id: activity.id, ...data });
    else await create.mutateAsync(data);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={activity ? `Edit ${terms.activity}` : `Add ${terms.activity}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={`${terms.activity} Name`} value={form.name} onChange={set('name')} required />
        <Select
          label="Center"
          value={form.centerId}
          onChange={set('centerId')}
          required
          options={centers?.map((c) => ({ value: c.id, label: c.name })) || []}
        />
        <Textarea label="Description" value={form.description} onChange={set('description')} />
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Assign teachers to this {terms.activity.toLowerCase()}
          </legend>
          <p className="text-xs text-slate-500">These teachers can see every student and {terms.classLevel.toLowerCase()} in it.</p>
          <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
            {teachers.length === 0 ? (
              <p className="text-sm text-slate-500">No teachers or staff are available for this {terms.center.toLowerCase()}.</p>
            ) : teachers.map((teacher) => (
              <label key={teacher.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.teacherIds.includes(teacher.id)} onChange={() => toggleTeacher(teacher.id)} />
                {teacher.fullName}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fee Amount" type="number" step="0.01" value={form.feeAmount} onChange={set('feeAmount')} />
          <Select
            label="Currency"
            value={form.feeCurrency}
            onChange={set('feeCurrency')}
            options={[{ value: 'NGN', label: 'NGN' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" type="time" value={form.startTime} onChange={set('startTime')} />
          <Input label="End Time" type="time" value={form.endTime} onChange={set('endTime')} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || update.isPending}>
            {activity ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
