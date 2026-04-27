import { useEffect, useState } from 'react';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { useTenant, useUpdateTenant } from '../../hooks/queries/use-tenants';

export default function ChildLifecyclePage() {
  const { data: tenant, isLoading } = useTenant();
  const updateTenant = useUpdateTenant();

  const [suspensionDays, setSuspensionDays] = useState(7);
  const [deletionDays, setDeletionDays] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tenant) {
      setSuspensionDays(tenant.childSuspensionDays ?? 7);
      setDeletionDays(tenant.childDeletionDays ?? 30);
    }
  }, [tenant]);

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (suspensionDays < 1 || suspensionDays > 60) {
      setError('Suspension period must be between 1 and 60 days.');
      return;
    }
    if (deletionDays < 7 || deletionDays > 365) {
      setError('Deletion period must be between 7 and 365 days.');
      return;
    }
    if (deletionDays < suspensionDays) {
      setError('Deletion period must be greater than or equal to the suspension period.');
      return;
    }
    try {
      await updateTenant.mutateAsync({
        childSuspensionDays: suspensionDays,
        childDeletionDays: deletionDays,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to save. Try again.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Child Lifecycle</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Control how long overdue payments have before a child is suspended and deleted.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Suspend child after (days overdue)
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Warnings are sent to the owner 3 days and 1 day before. Range: 1–60.
          </p>
          <input
            type="number"
            min={1}
            max={60}
            value={suspensionDays}
            onChange={(e) => setSuspensionDays(Number(e.target.value))}
            className="mt-2 w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Delete child data after (days suspended)
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            The owner is warned 7 days before deletion. Range: 7–365.
          </p>
          <input
            type="number"
            min={7}
            max={365}
            value={deletionDays}
            onChange={(e) => setDeletionDays(Number(e.target.value))}
            className="mt-2 w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-4 py-3">
          <p className="text-sm text-indigo-700 dark:text-indigo-400">
            Children are suspended <strong>{suspensionDays}</strong> day{suspensionDays !== 1 ? 's' : ''} after a missed payment and deleted <strong>{deletionDays}</strong> day{deletionDays !== 1 ? 's' : ''} after suspension.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={updateTenant.isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
        >
          {updateTenant.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {saved ? 'Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
