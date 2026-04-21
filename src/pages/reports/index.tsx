import { useState } from 'react';
import { FileText, Plus, ChevronDown, Trash2, CheckCircle, Send, Eye } from 'lucide-react';
import { useReports, useCreateReport, useUpdateReport, useDeleteReport } from '../../hooks/queries/use-reports';
import { useChildren } from '../../hooks/queries/use-children';
import { useEnrollments } from '../../hooks/queries/use-enrollments';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Modal } from '../../components/ui/modal';
import { Loading } from '../../components/ui/loading';
import { Badge } from '../../components/ui/badge';
import { formatDateTime, cn } from '../../lib/utils';
import type { Report, ReportStatus } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReportStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  draft:     { label: 'Draft',     variant: 'default' },
  submitted: { label: 'Submitted', variant: 'warning' },
  approved:  { label: 'Approved',  variant: 'success' },
  published: { label: 'Published', variant: 'success' },
};

const STATUS_TRANSITIONS: Record<ReportStatus, { label: string; next: ReportStatus; Icon: typeof Send }[]> = {
  draft:     [{ label: 'Submit',  next: 'submitted', Icon: Send }],
  submitted: [{ label: 'Approve', next: 'approved',  Icon: CheckCircle }, { label: 'Back to Draft', next: 'draft', Icon: ChevronDown }],
  approved:  [{ label: 'Publish', next: 'published', Icon: Eye }, { label: 'Back to Submitted', next: 'submitted', Icon: ChevronDown }],
  published: [],
};

// ── Report Form Modal ─────────────────────────────────────────────────────────

function ReportModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Report | null;
}) {
  const { data: children = [] } = useChildren('active');
  const [childId, setChildId] = useState(editing?.childId ?? '');
  const { data: enrollments = [] } = useEnrollments(childId || undefined);

  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport();

  const [enrollmentId, setEnrollmentId] = useState(editing?.enrollmentId ?? '');
  const [period, setPeriod] = useState(editing?.period ?? '');
  const [content, setContent] = useState(editing?.content ?? '');
  const [error, setError] = useState('');

  function reset() {
    setChildId(''); setEnrollmentId(''); setPeriod(''); setContent(''); setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!childId) { setError('Select a student.'); return; }
    if (!period.trim()) { setError('Enter a reporting period.'); return; }

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, period, content: content || undefined });
      } else {
        await createMutation.mutateAsync({
          childId,
          enrollmentId: enrollmentId || undefined,
          period,
          content: content || undefined,
        });
      }
      reset();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={editing ? 'Edit Report' : 'New Report'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!editing && (
          <>
            <Select
              label="Student"
              value={childId}
              onChange={(e) => { setChildId(e.target.value); setEnrollmentId(''); }}
              options={[
                { value: '', label: 'Select a student…' },
                ...children.map((c) => ({ value: c.id, label: c.fullName })),
              ]}
            />
            <Select
              label="Activity / Enrollment (optional)"
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              options={[
                { value: '', label: 'No specific activity (general report)' },
                ...enrollments.map((e) => ({ value: e.id, label: e.activity?.name ?? e.id })),
              ]}
            />
          </>
        )}

        <Input
          label="Reporting Period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="e.g. Term 1 2025 · Week 3 · Q1 2025"
        />

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            Report Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your observations, progress notes, and recommendations here…"
            rows={8}
            maxLength={10000}
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none leading-relaxed"
          />
          <p className="text-xs text-slate-400">{content.length} / 10 000 characters</p>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Report'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Report row ────────────────────────────────────────────────────────────────

function ReportRow({ report }: { report: Report }) {
  const updateMutation = useUpdateReport();
  const deleteMutation = useDeleteReport();
  const [editing, setEditing] = useState(false);

  const transitions = STATUS_TRANSITIONS[report.status] ?? [];
  const cfg = STATUS_CONFIG[report.status];

  return (
    <>
      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
        <td className="py-3 px-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {report.child?.fullName ?? report.childId}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {report.enrollment?.activity?.name ?? 'General'}
          </p>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-slate-700 dark:text-slate-300">{report.period}</span>
        </td>
        <td className="py-3 px-4">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </td>
        <td className="py-3 px-4 max-w-xs">
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
            {report.content ?? <span className="italic text-slate-400">No content yet</span>}
          </p>
        </td>
        <td className="py-3 px-4 text-xs text-slate-400">{formatDateTime(report.createdAt)}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5 justify-end">
            {transitions.map(({ label, next, Icon }) => (
              <button
                key={next}
                onClick={() => updateMutation.mutate({ id: report.id, status: next })}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
              >
                <Icon size={11} />{label}
              </button>
            ))}
            {report.status !== 'published' && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Edit
              </button>
            )}
            {report.status === 'draft' && (
              <button
                onClick={() => { if (confirm('Delete this report?')) deleteMutation.mutate(report.id); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
      {editing && <ReportModal open={editing} onClose={() => setEditing(false)} editing={report} />}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export default function ReportsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useReports({
    status: filterStatus as ReportStatus || undefined,
    period: filterPeriod || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const reports = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const counts = reports.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Student progress reports across all activities and periods
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1.5" />New Report
        </Button>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        {(['draft', 'submitted', 'approved', 'published'] as ReportStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => { setFilterStatus(filterStatus === s ? '' : s); setPage(0); }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                filterStatus === s
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300',
              )}
            >
              {cfg.label}
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full px-1.5 py-0.5 text-[10px]">
                {counts[s] ?? 0}
              </span>
            </button>
          );
        })}
        <div className="ml-auto w-48">
          <input
            value={filterPeriod}
            onChange={(e) => { setFilterPeriod(e.target.value); setPage(0); }}
            placeholder="Filter by period…"
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <Loading />
        ) : reports.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No reports yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create the first report for a student.</p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={14} className="mr-1" />New Report
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Student', 'Period', 'Status', 'Content', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => <ReportRow key={r.id} report={r} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <ReportModal open={showCreate} onClose={() => setShowCreate(false)} editing={null} />
    </div>
  );
}
