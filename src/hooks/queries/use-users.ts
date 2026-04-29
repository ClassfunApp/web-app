import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { User } from '../../types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data as User[];
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fullName: string; email: string; password?: string; phone?: string; role?: string; roles?: string[]; centerId?: string }) => {
      const res = await api.post('/users', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; fullName?: string; phone?: string; role?: string; centerId?: string | null; isActive?: boolean }) => {
      const res = await api.patch(`/users/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/users/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
