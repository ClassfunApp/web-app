import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Activity, ClassLevel } from '../../types';

export function useActivities(centerId?: string) {
  return useQuery({
    queryKey: ['activities', centerId],
    queryFn: async () => {
      const params = centerId ? { centerId } : {};
      const res = await api.get('/activities', { params });
      return res.data.data as Activity[];
    },
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Activity>) => {
      const res = await api.post('/activities', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Activity> & { id: string }) => {
      const res = await api.patch(`/activities/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/activities/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useCreateClassLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ClassLevel> & { activityId: string }) => {
      const res = await api.post('/activities/class-levels', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useUpdateClassLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ClassLevel> & { id: string }) => {
      const res = await api.patch(`/activities/class-levels/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useDeleteClassLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/activities/class-levels/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}
