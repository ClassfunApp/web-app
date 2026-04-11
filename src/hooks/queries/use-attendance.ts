import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Attendance } from '../../types';

export function useAttendance(filters: { centerId?: string; date?: string; childId?: string }) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: async () => {
      const res = await api.get('/attendance', { params: filters });
      return res.data.data as Attendance[];
    },
  });
}

export function useMarkManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { enrollmentId: string; centerId: string; date: string; signedInAt?: string; signedOutAt?: string }) => {
      const res = await api.post('/attendance/manual', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}
