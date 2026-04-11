import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import type { NotificationLog } from '../../types';

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { limit } });
      return res.data.data as NotificationLog[];
    },
  });
}

export function useSendBroadcast() {
  return useMutation({
    mutationFn: async (data: { recipientPhone: string; message: string }) => {
      const res = await api.post('/notifications/broadcast', data);
      return res.data.data;
    },
  });
}
