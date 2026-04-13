import { useState } from 'react';
import { Plus, Trash2, Pencil, Layers } from 'lucide-react';
import { useActivities, useDeleteActivity, useDeleteClassLevel } from '../../hooks/queries/use-activities';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { ActivityForm } from './activity-form';
import { ClassLevelForm } from './class-level-form';
import { formatCurrency } from '../../lib/utils';
import type { Activity } from '../../types';

export default function ActivitiesPage() {
  const { data: activities, isLoading } = useActivities();
  const deleteActivity = useDeleteActivity();
  const deleteClassLevel = useDeleteClassLevel();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [classLevelFor, setClassLevelFor] = useState<string | null>(null);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Activities</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-2" /> Add Activity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities?.map((activity) => (
          <Card key={activity.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{activity.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{activity.center?.name || 'Unknown center'}</p>
                  {activity.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activity.description}</p>}
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{formatCurrency(Number(activity.feeAmount), activity.feeCurrency)}/session</p>
                </div>
                <Badge status={activity.isActive ? 'active' : 'inactive'} />
              </div>

              {activity.classLevels?.length ? (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Class Levels</p>
                  <div className="flex flex-wrap gap-2">
                    {activity.classLevels.map((cl) => (
                      <span key={cl.id} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full px-3 py-1 text-xs">
                        {cl.name} {cl.capacity && `(${cl.capacity})`}
                        <button className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400" onClick={() => { if (confirm('Delete this level?')) deleteClassLevel.mutate(cl.id); }}>&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <Button size="sm" variant="secondary" onClick={() => { setEditing(activity); setFormOpen(true); }}><Pencil size={14} className="mr-1" /> Edit</Button>
                <Button size="sm" variant="secondary" onClick={() => setClassLevelFor(activity.id)}><Layers size={14} className="mr-1" /> Add Level</Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { if (confirm('Delete?')) deleteActivity.mutate(activity.id); }}><Trash2 size={14} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!activities?.length && <p className="text-center py-12 text-slate-500 dark:text-slate-400">No activities yet.</p>}

      <ActivityForm open={formOpen} onClose={() => setFormOpen(false)} activity={editing} />
      {classLevelFor && <ClassLevelForm open={!!classLevelFor} onClose={() => setClassLevelFor(null)} activityId={classLevelFor} />}
    </div>
  );
}
