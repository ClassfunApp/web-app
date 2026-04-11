import { useState } from 'react';
import { Send } from 'lucide-react';
import { useNotifications, useSendBroadcast } from '../../hooks/queries/use-notifications';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { formatDateTime } from '../../lib/utils';
import type { NotificationLog } from '../../types';

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const sendBroadcast = useSendBroadcast();
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [form, setForm] = useState({ recipientPhone: '', message: '' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendBroadcast.mutateAsync(form);
    setForm({ recipientPhone: '', message: '' });
    setBroadcastOpen(false);
  };

  const columns = [
    { key: 'type', header: 'Type', render: (n: NotificationLog) => (
      <Badge status={n.type === 'whatsapp' ? 'active' : 'pending'}>{n.type}</Badge>
    )},
    { key: 'template', header: 'Template', render: (n: NotificationLog) => n.template || '—' },
    { key: 'status', header: 'Status', render: (n: NotificationLog) => (
      <Badge status={n.status === 'sent' ? 'paid' : n.status === 'delivered' ? 'active' : 'overdue'}>
        {n.status}
      </Badge>
    )},
    { key: 'sentAt', header: 'Sent At', render: (n: NotificationLog) => formatDateTime(n.sentAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <Button onClick={() => setBroadcastOpen(true)}>
          <Send size={16} className="mr-2" /> Send Message
        </Button>
      </div>

      {isLoading ? <Loading /> : (
        <Card>
          <Table columns={columns} data={notifications as unknown as Record<string, unknown>[] || []} emptyMessage="No notifications yet" />
        </Card>
      )}

      <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} title="Send Broadcast Message">
        <form onSubmit={handleSend} className="space-y-4">
          <Input
            label="Recipient Phone"
            placeholder="+234..."
            required
            value={form.recipientPhone}
            onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
          />
          <Textarea
            label="Message"
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={sendBroadcast.isPending}>Send</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
