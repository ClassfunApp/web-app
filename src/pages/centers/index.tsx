import { useState } from 'react';
import { Plus, QrCode, Trash2, Pencil, Building2, PowerOff, Power } from 'lucide-react';
import { useCenters, useDeleteCenter, useGenerateQrCode, useUpdateCenter } from '../../hooks/queries/use-centers';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { Modal } from '../../components/ui/modal';
import { CenterForm } from './center-form';
import type { Center } from '../../types';

export default function CentersPage() {
  const { data: centers, isLoading } = useCenters();
  const deleteCenter = useDeleteCenter();
  const generateQr = useGenerateQrCode();
  const updateCenter = useUpdateCenter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Center | null>(null);
  const [qrModal, setQrModal] = useState<{ url: string; name: string } | null>(null);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Centers</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-2" /> Add Center
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {centers?.map((center) => (
          <Card key={center.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{center.name}</h3>
                  {center.address && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{center.address}</p>}
                  {center.phone && <p className="text-sm text-slate-500 dark:text-slate-400">{center.phone}</p>}
                </div>
                <Badge status={center.status} />
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <Button size="sm" variant="secondary" onClick={() => { setEditing(center); setFormOpen(true); }}>
                  <Pencil size={14} className="mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const res = await generateQr.mutateAsync(center.id);
                    setQrModal({ url: res.qrCodeUrl, name: center.name });
                  }}
                >
                  <QrCode size={14} className="mr-1" /> QR Code
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={center.status === 'active' ? 'text-amber-500 hover:text-amber-700' : 'text-green-600 hover:text-green-800'}
                  onClick={() => {
                    const newStatus = center.status === 'active' ? 'inactive' : 'active';
                    if (confirm(`${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} "${center.name}"?`)) {
                      updateCenter.mutate({ id: center.id, status: newStatus as any });
                    }
                  }}
                >
                  {center.status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => { if (confirm('Delete this center?')) deleteCenter.mutate(center.id); }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!centers?.length && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Building2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p>No centers yet. Add your first center to get started.</p>
        </div>
      )}

      <CenterForm open={formOpen} onClose={() => setFormOpen(false)} center={editing} />

      <Modal open={!!qrModal} onClose={() => setQrModal(null)} title={`QR Code - ${qrModal?.name}`}>
        {qrModal && (
          <div className="text-center py-4">
            <img src={qrModal.url} alt="QR Code" className="mx-auto w-64 h-64" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Display this QR code at your center entrance for parents to scan.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
