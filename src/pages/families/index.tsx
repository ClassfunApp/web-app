import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useFamilies, useDeleteFamily } from '../../hooks/queries/use-families';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Loading } from '../../components/ui/loading';
import { FamilyForm } from './family-form';
import type { Family } from '../../types';

export default function FamiliesPage() {
  const { user } = useAuth();
  const { data: families, isLoading } = useFamilies();
  const deleteFamily = useDeleteFamily();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Family | null>(null);

  const isOwner = !!user?.roles?.includes('business_owner');

  function handleDelete(f: Family) {
    const count = f.children?.length ?? 0;
    const message = `Delete the ${f.familyName} family? This also removes ${count} ${count === 1 ? 'child' : 'children'} and all guardian records. Guardian login accounts are kept. This cannot be undone.`;
    if (confirm(message)) deleteFamily.mutate(f.id);
  }

  if (isLoading) return <Loading />;

  const columns = [
    { key: 'familyName', header: 'Family Name' },
    { key: 'guardians', header: 'Guardians', render: (f: Family) => f.guardians?.map((g) => g.fullName).join(', ') || '—' },
    { key: 'children', header: 'Children', render: (f: Family) => String(f.children?.length ?? 0) },
    { key: 'actions', header: '', render: (f: Family) => (
      <div className="flex gap-1">
        <button className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => { setEditing(f); setFormOpen(true); }}><Pencil size={16} /></button>
        {isOwner && (
          <button className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50" disabled={deleteFamily.isPending} onClick={() => handleDelete(f)}><Trash2 size={16} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Families</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} className="mr-2" /> Add Family</Button>
      </div>
      <Card>
        <Table columns={columns} data={families as unknown as Record<string, unknown>[] || []} emptyMessage="No families yet" />
      </Card>
      <FamilyForm open={formOpen} onClose={() => setFormOpen(false)} family={editing} />
    </div>
  );
}
