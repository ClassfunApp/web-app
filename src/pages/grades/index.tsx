import { useState } from 'react';
import { GraduationCap, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useGrades, useCreateGrade, useUpdateGrade, usePublishGrade, useUnpublishGrade, useDeleteGrade } from '../../hooks/queries/use-grades';
import { useChildren } from '../../hooks/queries/use-children';
import { useEnrollments } from '../../hooks/queries/use-enrollments';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Modal } from '../../components/ui/modal';
import { Loading } from '../../components/ui/loading';
import { Badge } from '../../components/ui/badge';
import { formatDateTime } from '../../lib/utils';
import type { Grade } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function letterGradeColor(letter: string | null): string {
  if (!letter) return 'text-slate-400';
  const l = letter.toUpperCase();
  if (l.startsWith('A')) return 'text-emerald-600 dark:text-emerald-400';
  if (l.startsWith('B')) return 'text-sky-600 dark:text-sky-400';
  if (l.startsWith('C')) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function scorePercent(score: number | null, maxScore: number | null): string | null {
  if (score == null || !maxScore) return null;
  return `${Math.round((score / maxScore) * 100)}%`;
}

// ── Grade Form Modal ──────────────────────────────────────────────────────────

function GradeModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Grade | null;
}) {
  const { data: children = [] } = useChildren('active');
  const [childId, setChildId] = useState(editing?.childId ?? '');
  const { data: enrollments = [] } = useEnrollments(childId || undefined);

  const createMutation = useCreateGrade();
  const updateMutation = useUpdateGrade();

  const [enrollmentId, setEnrollmentId] = useState(editing?.enrollmentId ?? '');
  const [period, setPeriod]             = useState(editing?.period ?? '');
  const [score, setScore]               = useState(editing?.score?.toString() ?? '');
  const [maxScore, setMaxScore]         = useState(editing?.maxScore?.toString() ?? '100');
  const [letterGrade, setLetterGrade]   = useState(editing?.letterGrade ?? '');
  const [comments, setComments]         = useState(editing?.comments ?? '');
  const [error, setError]               = useState('');

  function reset() {
    setChildId(''); setEnrollmentId(''); setPeriod('');
    setScore(''); setMaxScore('100'); setLetterGrade(''); setComments(''); setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!editing && !enrollmentId) { setError('Select an activity / enrollment.'); return; }
    if (!period.trim())             { setError('Enter a reporting period.'); return; }

    const scoreNum    = score    ? parseFloat(score)    : undefined;
    const maxScoreNum = maxScore ? parseFloat(maxScore) : undefined;

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          period,
          score: scoreNum,
          maxScore: maxScoreNum,
          letterGrade: letterGrade || undefined,
          comments: comments || undefined,
        });
      } else {
        await createMutation.mutateAsync({
          enrollmentId,
          period,
          score: scoreNum,
          maxScore: maxScoreNum,
          letterGrade: letterGrade || undefined,
          comments: comments || undefined,
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
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={editing ? 'Edit Grade' : 'New Grade'} size="lg">
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
              label="Activity / Enrollment"
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              options={[
                { value: '', label: childId ? 'Select an activity…' : 'Select a student first' },
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

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Score"
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="e.g. 85"
          />
          <Input
            label="Max Score"
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            placeholder="100"
          />
          <Input
            label="Letter Grade"
            value={letterGrade}
            onChange={(e) => setLetterGrade(e.target.value)}
            placeholder="A, B+, C…"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Additional comments or feedback…"
            rows={4}
            maxLength={2000}
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none leading-relaxed"
          />
          <p className="text-xs text-slate-400">{comments.length} / 2 000 characters</p>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Grade'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Grade row ─────────────────────────────────────────────────────────────────

function GradeRow({ grade }: { grade: Grade }) {
  const publishMutation   = usePublishGrade();
  const unpublishMutation = useUnpublishGrade();
  const deleteMutation    = useDeleteGrade();
  const [editing, setEditing] = useState(false);

  const pct = scorePercent(grade.score, grade.maxScore);

  return (
    <>
      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
        {/* Student */}
        <td className="py-3 px-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {grade.child?.fullName ?? grade.childId}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {grade.enrollment?.activity?.name ?? '—'}
          </p>
        </td>

        {/* Period */}
        <td className="py-3 px-4">
          <span className="text-sm text-slate-700 dark:text-slate-300">{grade.period}</span>
        </td>

        {/* Score */}
        <td className="py-3 px-4">
          <div className="flex items-baseline gap-1.5">
            {grade.score != null ? (
              <>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {grade.score}
                  {grade.maxScore ? <span className="text-xs font-normal text-slate-400">/{grade.maxScore}</span> : null}
                </span>
                {pct && <span className="text-xs text-slate-400">({pct})</span>}
              </>
            ) : (
              <span className="text-sm text-slate-400 italic">—</span>
            )}
          </div>
        </td>

        {/* Letter */}
        <td className="py-3 px-4">
          {grade.letterGrade ? (
            <span className={`text-base font-bold ${letterGradeColor(grade.letterGrade)}`}>
              {grade.letterGrade}
            </span>
          ) : (
            <span className="text-sm text-slate-400 italic">—</span>
          )}
        </td>

        {/* Published */}
        <td className="py-3 px-4">
          <Badge variant={grade.isPublished ? 'success' : 'default'}>
            {grade.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </td>

        {/* Comments */}
        <td className="py-3 px-4 max-w-xs">
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
            {grade.comments ?? <span className="italic text-slate-400">—</span>}
          </p>
        </td>

        {/* Created */}
        <td className="py-3 px-4 text-xs text-slate-400">{formatDateTime(grade.createdAt)}</td>

        {/* Actions */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5 justify-end">
            {grade.isPublished ? (
              <button
                onClick={() => unpublishMutation.mutate(grade.id)}
                disabled={unpublishMutation.isPending}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
              >
                <EyeOff size={11} />Unpublish
              </button>
            ) : (
              <button
                onClick={() => publishMutation.mutate(grade.id)}
                disabled={publishMutation.isPending}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
              >
                <Eye size={11} />Publish
              </button>
            )}
            {!grade.isPublished && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Edit
              </button>
            )}
            {!grade.isPublished && (
              <button
                onClick={() => { if (confirm('Delete this grade?')) deleteMutation.mutate(grade.id); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
      {editing && <GradeModal open={editing} onClose={() => setEditing(false)} editing={grade} />}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export default function GradesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [page, setPage] = useState(0);

  const isPublished = filterPublished === 'published' ? true : filterPublished === 'draft' ? false : undefined;

  const { data, isLoading } = useGrades({
    isPublished,
    period: filterPeriod || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const grades = data?.data ?? [];
  const total  = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const publishedCount = grades.filter((g) => g.isPublished).length;
  const draftCount     = grades.filter((g) => !g.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Grades</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Student grades per activity and reporting period
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1.5" />New Grade
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {([
          { key: 'all',       label: 'All',       count: grades.length },
          { key: 'published', label: 'Published',  count: publishedCount },
          { key: 'draft',     label: 'Draft',      count: draftCount },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setFilterPublished(key); setPage(0); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterPublished === key
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {label}
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full px-1.5 py-0.5 text-[10px]">
              {count}
            </span>
          </button>
        ))}
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
        ) : grades.length === 0 ? (
          <div className="py-16 text-center">
            <GraduationCap size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No grades yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create the first grade for a student.</p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={14} className="mr-1" />New Grade
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Student', 'Period', 'Score', 'Grade', 'Status', 'Comments', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => <GradeRow key={g.id} grade={g} />)}
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

      <GradeModal open={showCreate} onClose={() => setShowCreate(false)} editing={null} />
    </div>
  );
}
