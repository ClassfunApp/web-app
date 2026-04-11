import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Child } from '../../types';

export function useChildren(status?: string) {
  return useQuery({
    queryKey: ['children', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const res = await api.get('/children', { params });
      return res.data.data as Child[];
    },
  });
}

export function useChild(id: string) {
  return useQuery({
    queryKey: ['children', id],
    queryFn: async () => {
      const res = await api.get(`/children/${id}`);
      return res.data.data as Child;
    },
    enabled: !!id,
  });
}

export function useCreateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Child>) => {
      const res = await api.post('/children', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}

export function useUpdateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Child> & { id: string }) => {
      const res = await api.patch(`/children/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}

export function useDeleteChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/children/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}

export function useBulkImportChildren() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { children: Record<string, unknown>[] }) => {
      const res = await api.post('/children/bulk-import', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}
