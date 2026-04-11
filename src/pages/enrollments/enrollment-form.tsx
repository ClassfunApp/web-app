import { useState } from 'react';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { useCreateEnrollment } from '../../hooks/queries/use-enrollments';
import { useChildren } from '../../hooks/queries/use-children';
import { useActivities } from '../../hooks/queries/use-activities';

interface Props { open: boolean; onClose: () => void; }

export function EnrollmentForm({ open, onClose }: Props) {
  const [form, setForm] = useState({ childId: '', activityId: '', classLevelId: '' });
  const { data: children } = useChildren();
  const { data: activities } = useActivities();
  const create = useCreateEnrollment();

  const selectedActivity = activities?.find((a) => a.id === form.activityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ childId: form.childId, activityId: form.activityId, classLevelId: form.classLevelId || undefined });
    setForm({ childId: '', activityId: '', classLevelId: '' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Enroll Child">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Child" value={form.childId} onChange={(e) => setForm((f) => ({ ...f, childId: e.target.value }))} required options={children?.map((c) => ({ value: c.id, label: c.fullName })) || []} />
        <Select label="Activity" value={form.activityId} onChange={(e) => setForm((f) => ({ ...f, activityId: e.target.value, classLevelId: '' }))} required options={activities?.map((a) => ({ value: a.id, label: `${a.name} (${a.center?.name || ''})` })) || []} />
        {selectedActivity?.classLevels?.length ? (
          <Select label="Class Level" value={form.classLevelId} onChange={(e) => setForm((f) => ({ ...f, classLevelId: e.target.value }))} options={selectedActivity.classLevels.map((cl) => ({ value: cl.id, label: cl.name }))} />
        ) : null}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>Enroll</Button>
        </div>
      </form>
    </Modal>
  );
}
