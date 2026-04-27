import { useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  useEnrolmentRequests,
  useApproveEnrolmentRequest,
  useRejectEnrolmentRequest,
} from '../../hooks/queries/use-enrolment-requests';
import { useActivities } from '../../hooks/queries/use-activities';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { formatDate } from '../../lib/utils';
import type { EnrolmentRequest, EnrolmentRequestStatus } from '../../types';

const STATUS_FILTERS: Array<{ value: EnrolmentRequestStatus | 'all'; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Declined' },
  { value: 'all', label: 'All' },
];

export default function EnrolmentRequestsPage() {
  const [filter, setFilter] = useState<EnrolmentRequestStatus | 'all'>('pending');
  const { data: requests, isLoading } = useEnrolmentRequests(
    filter === 'all' ? undefined : filter,
  );

  const [approveTarget, setApproveTarget] = useState<EnrolmentRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<EnrolmentRequest | null>(null);

  if (isLoading) return <Loading />;

  const columns = [
    {
      key: 'child',
      header: 'Child',
      render: (r: EnrolmentRequest) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-100">
            {r.childFullName}
          </div>
          {r.childDob && (
            <div className="text-xs text-slate-500">DOB: {r.childDob}</div>
          )}
        </div>
      ),
    },
    {
      key: 'family',
      header: 'Family',
      render: (r: EnrolmentRequest) => r.family?.familyName ?? '—',
    },
    {
      key: 'requestedBy',
      header: 'Requested by',
      render: (r: EnrolmentRequest) => r.requestedBy?.fullName ?? '—',
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (r: EnrolmentRequest) => r.activity?.name ?? '—',
    },
    {
      key: 'note',
      header: 'Note',
      render: (r: EnrolmentRequest) => (
        <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {r.note ?? '—'}
        </span>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (r: EnrolmentRequest) => formatDate(r.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: EnrolmentRequest) => <Badge status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r: EnrolmentRequest) =>
        r.status === 'pending' ? (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setApproveTarget(r)}
              title="Approve"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => setRejectTarget(r)}
              title="Decline"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        ) : r.status === 'rejected' && r.decisionReason ? (
          <span className="text-xs text-red-500">{r.decisionReason}</span>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Enrolment Requests
        </h1>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filter === f.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          data={(requests as unknown as Record<string, unknown>[]) || []}
          emptyMessage="No requests"
        />
      </Card>

      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}

function ApproveModal({
  request,
  onClose,
}: {
  request: EnrolmentRequest;
  onClose: () => void;
}) {
  const { data: activities } = useActivities();
  const [activityId, setActivityId] = useState(request.activityId ?? '');
  const [classLevelId, setClassLevelId] = useState('');
  const approve = useApproveEnrolmentRequest();

  const selectedActivity = activities?.find((a) => a.id === activityId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await approve.mutateAsync({
      id: request.id,
      activityId: activityId || undefined,
      classLevelId: classLevelId || undefined,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`Approve: ${request.childFullName}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Approving creates the child record in{' '}
          <span className="font-semibold">{request.family?.familyName ?? 'this family'}</span>
          {activityId ? ' and enrols them in the selected activity.' : '. You can enrol them in an activity later from Enrollments.'}
        </p>
        <Select
          label="Activity (optional)"
          value={activityId}
          onChange={(e) => {
            setActivityId(e.target.value);
            setClassLevelId('');
          }}
          options={[
            { value: '', label: '— No activity yet —' },
            ...(activities?.map((a) => ({
              value: a.id,
              label: `${a.name}${a.center?.name ? ` (${a.center.name})` : ''}`,
            })) ?? []),
          ]}
        />
        {selectedActivity?.classLevels?.length ? (
          <Select
            label="Class Level"
            value={classLevelId}
            onChange={(e) => setClassLevelId(e.target.value)}
            options={[
              { value: '', label: '— Select level —' },
              ...selectedActivity.classLevels.map((cl) => ({
                value: cl.id,
                label: cl.name,
              })),
            ]}
          />
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={approve.isPending}>
            {approve.isPending ? 'Approving…' : 'Approve & create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RejectModal({
  request,
  onClose,
}: {
  request: EnrolmentRequest;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const reject = useRejectEnrolmentRequest();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await reject.mutateAsync({ id: request.id, reason: reason.trim() });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`Decline: ${request.childFullName}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The parent will see this reason on their request. Be specific so they
          know what to do next.
        </p>
        <Textarea
          label="Reason for declining"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={4}
          placeholder="e.g. We're at full capacity for the term — try again next term."
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!reason.trim() || reject.isPending}
            className="!bg-red-600 hover:!bg-red-700"
          >
            {reject.isPending ? 'Declining…' : 'Decline request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
