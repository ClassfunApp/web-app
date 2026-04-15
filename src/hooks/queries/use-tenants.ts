import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { DashboardStats, Tenant } from '../../types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/tenants/dashboard');
      return res.data.data as DashboardStats;
    },
  });
}

export function useTenant() {
  return useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return res.data.data as Tenant;
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/tenants/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as Tenant;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['tenant'], updated);
      // Also update logoUrl in dashboard cache
      queryClient.setQueryData(['dashboard'], (old: DashboardStats | undefined) =>
        old ? { ...old, tenant: { ...old.tenant, logoUrl: updated.logoUrl } } : old,
      );
    },
  });
}
