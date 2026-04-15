import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { FeePayment } from '../../types';

export function usePayments(childId?: string, status?: string) {
  return useQuery({
    queryKey: ['payments', childId, status],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (childId) params.childId = childId;
      if (status) params.status = status;
      const res = await api.get('/payments', { params });
      return res.data.data as FeePayment[];
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: async () => {
      const res = await api.get(`/payments/${id}`);
      return res.data.data as FeePayment;
    },
    enabled: !!id,
  });
}

export interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function useCreateFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      childId: string;
      description?: string;
      amount?: number;
      currency?: string;
      dueDate: string;
      lineItems?: LineItemInput[];
    }) => {
      const res = await api.post('/payments', data);
      return res.data.data as FeePayment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}

export function useGeneratePaymentLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { feePaymentId: string; callbackUrl?: string }) => {
      const res = await api.post('/payments/generate-link', data);
      return res.data.data as { paymentLink: string; reference: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}

export function useMarkAsPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/payments/${id}/mark-paid`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}

export function useShareViaWhatsApp() {
  return useMutation({
    mutationFn: async (data: { feePaymentId: string }) => {
      const res = await api.post('/payments/share-whatsapp', data);
      return res.data.data as { success: boolean; guardianPhone: string };
    },
  });
}
