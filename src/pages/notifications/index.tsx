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
    {
      key: 'type',
      header: 'Type',
      render: (n: NotificationLog) => (
        <Badge status={n.type === 'whatsapp' ? 'active' : n.type === 'push' ? 'pending' : 'draft'}>
          {n.type}
        </Badge>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (n: NotificationLog) =>
        n.title ? (
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{n.title}</p>
            {n.body && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {n.body}
              </p>
            )}
          </div>
        ) : (
          <span className="text-slate-500 text-sm">{n.template || n.event || '—'}</span>
        ),
    },
    {
      key: 'event',
      header: 'Event',
      render: (n: NotificationLog) =>
        n.event ? (
          <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
            {n.event}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (n: NotificationLog) => (
        <Badge
          status={
            n.status === 'delivered' ? 'active' : n.status === 'sent' ? 'paid' : 'overdue'
          }
        >
          {n.status}
        </Badge>
      ),
    },
    {
      key: 'sentAt',
      header: 'Sent At',
      render: (n: NotificationLog) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDateTime(n.sentAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
        <Button onClick={() => setBroadcastOpen(true)}>
          <Send size={16} className="mr-2" /> Send Message
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <Card>
          <Table
            columns={columns}
            data={(notifications as unknown as Record<string, unknown>[]) || []}
            emptyMessage="No notifications sent yet"
          />
        </Card>
      )}

      <Modal
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Send Broadcast Message"
      >
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
            <Button type="button" variant="secondary" onClick={() => setBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendBroadcast.isPending}>
              Send
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
