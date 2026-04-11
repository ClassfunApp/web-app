import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { UserVerification, TenantVerification } from '../../types';

// ── Personal KYC ─────────────────────────────────────────────────────────────

export function useMyUserVerification() {
  return useQuery({
    queryKey: ['verification', 'user'],
    queryFn: async () => {
      const res = await api.get('/verification/user');
      return res.data.data as UserVerification | null;
    },
  });
}

export function useSubmitUserVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/verification/user', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as UserVerification;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification', 'user'] });
      qc.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
}

// ── Business / Tenant Verification ───────────────────────────────────────────

export function useMyTenantVerification() {
  return useQuery({
    queryKey: ['verification', 'tenant'],
    queryFn: async () => {
      const res = await api.get('/verification/tenant');
      return res.data.data as TenantVerification | null;
    },
  });
}

export function useSubmitTenantVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/verification/tenant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as TenantVerification;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification', 'tenant'] });
      qc.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
}
