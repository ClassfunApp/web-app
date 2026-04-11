import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Center } from '../../types';

export function useCenters() {
  return useQuery({
    queryKey: ['centers'],
    queryFn: async () => {
      const res = await api.get('/centers');
      return res.data.data as Center[];
    },
  });
}

export function useCenter(id: string) {
  return useQuery({
    queryKey: ['centers', id],
    queryFn: async () => {
      const res = await api.get(`/centers/${id}`);
      return res.data.data as Center;
    },
    enabled: !!id,
  });
}

export function useCreateCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Center>) => {
      const res = await api.post('/centers', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['centers'] }),
  });
}

export function useUpdateCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Center> & { id: string }) => {
      const res = await api.patch(`/centers/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['centers'] }),
  });
}

export function useDeleteCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/centers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['centers'] }),
  });
}

export function useGenerateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (centerId: string) => {
      const res = await api.post(`/qr-codes/centers/${centerId}/generate`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['centers'] }),
  });
}
