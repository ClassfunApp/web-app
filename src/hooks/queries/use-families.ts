import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Family, Guardian } from '../../types';

export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const res = await api.get('/families');
      return res.data.data as Family[];
    },
  });
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: ['families', id],
    queryFn: async () => {
      const res = await api.get(`/families/${id}`);
      return res.data.data as Family;
    },
    enabled: !!id,
  });
}

export function useCreateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { familyName: string; guardians?: Partial<Guardian>[] }) => {
      const res = await api.post('/families', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  });
}

export function useUpdateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; familyName?: string }) => {
      const res = await api.patch(`/families/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  });
}

export function useDeleteFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/families/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  });
}

export function useAddGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ familyId, ...data }: Partial<Guardian> & { familyId: string }) => {
      const res = await api.post(`/families/${familyId}/guardians`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  });
}
