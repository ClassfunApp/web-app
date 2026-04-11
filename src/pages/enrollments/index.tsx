import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useEnrollments, useDeleteEnrollment } from '../../hooks/queries/use-enrollments';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { EnrollmentForm } from './enrollment-form';
import { formatDate } from '../../lib/utils';
import type { Enrollment } from '../../types';

export default function EnrollmentsPage() {
  const { data: enrollments, isLoading } = useEnrollments();
  const deleteEnrollment = useDeleteEnrollment();
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) return <Loading />;

  const columns = [
    { key: 'child', header: 'Child', render: (e: Enrollment) => e.child?.fullName || '—' },
    { key: 'activity', header: 'Activity', render: (e: Enrollment) => e.activity?.name || '—' },
    { key: 'classLevel', header: 'Class Level', render: (e: Enrollment) => e.classLevel?.name || '—' },
    { key: 'enrolledAt', header: 'Enrolled', render: (e: Enrollment) => formatDate(e.enrolledAt) },
    { key: 'status', header: 'Status', render: (e: Enrollment) => <Badge status={e.status} /> },
    { key: 'actions', header: '', render: (e: Enrollment) => (
      <button className="text-gray-400 hover:text-red-600" onClick={() => { if (confirm('Remove enrollment?')) deleteEnrollment.mutate(e.id); }}><Trash2 size={16} /></button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
        <Button onClick={() => setFormOpen(true)}><Plus size={16} className="mr-2" /> Enroll Child</Button>
      </div>
      <Card>
        <Table columns={columns} data={enrollments as unknown as Record<string, unknown>[] || []} emptyMessage="No enrollments yet" />
      </Card>
      <EnrollmentForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
