import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Enrollment } from '../../types';

export function useEnrollments(childId?: string, activityId?: string) {
  return useQuery({
    queryKey: ['enrollments', childId, activityId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (childId) params.childId = childId;
      if (activityId) params.activityId = activityId;
      const res = await api.get('/enrollments', { params });
      return res.data.data as Enrollment[];
    },
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { childId: string; activityId: string; classLevelId?: string }) => {
      const res = await api.post('/enrollments', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });
}

export function useUpdateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; classLevelId?: string; status?: string }) => {
      const res = await api.patch(`/enrollments/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });
}

export function useDeleteEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/enrollments/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });
}
