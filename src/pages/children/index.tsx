import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useChildren, useDeleteChild } from '../../hooks/queries/use-children';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { Input } from '../../components/ui/input';
import { ChildForm } from './child-form';
import { formatDate } from '../../lib/utils';
import type { Child } from '../../types';

export default function ChildrenPage() {
  const { data: children, isLoading } = useChildren();
  const deleteChild = useDeleteChild();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Child | null>(null);
  const [search, setSearch] = useState('');

  if (isLoading) return <Loading />;

  const filtered = children?.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()),
  ) || [];

  const columns = [
    { key: 'fullName', header: 'Name', render: (c: Child) => (
      <span className="font-medium cursor-pointer text-indigo-600 hover:text-indigo-800" onClick={() => navigate(`/children/${c.id}`)}>{c.fullName}</span>
    )},
    { key: 'dob', header: 'Date of Birth', render: (c: Child) => formatDate(c.dob) },
    { key: 'gender', header: 'Gender', render: (c: Child) => c.gender || '—' },
    { key: 'family', header: 'Family', render: (c: Child) => c.family?.familyName || '—' },
    { key: 'status', header: 'Status', render: (c: Child) => <Badge status={c.status} /> },
    { key: 'actions', header: '', render: (c: Child) => (
      <div className="flex gap-1">
        <button className="text-gray-400 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); setEditing(c); setFormOpen(true); }}><Pencil size={16} /></button>
        <button className="text-gray-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteChild.mutate(c.id); }}><Trash2 size={16} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Children</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-2" /> Add Child
        </Button>
      </div>

      <div className="max-w-sm">
        <Input placeholder="Search children..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table columns={columns} data={filtered as unknown as Record<string, unknown>[]} emptyMessage="No children found" />
      </Card>

      <ChildForm open={formOpen} onClose={() => setFormOpen(false)} child={editing} />
    </div>
  );
}
