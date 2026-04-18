import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export interface SubscriptionInvoice {
  id: string;
  tenantId: string;
  billingPeriod: string;
  childCount: number;
  amount: number;
  currency: string;
  plan: string;
  status: 'pending' | 'paid' | 'failed';
  paystackReference: string | null;
  checkoutUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface SubscriptionStatus {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  childCount: number;
  billingRegion: string;
  billingCurrency: string;
  monthlyAmount: number;
  annualAmount: number;
  nextInvoice: {
    period: string;
    amount: number;
    dueDate: string;
  } | null;
  outstandingInvoice: SubscriptionInvoice | null;
}

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: async () => {
      const res = await api.get('/subscription');
      return res.data.data as SubscriptionStatus;
    },
  });
}

export function useSubscriptionInvoices() {
  return useQuery({
    queryKey: ['subscription', 'invoices'],
    queryFn: async () => {
      const res = await api.get('/subscription/invoices');
      return res.data.data as SubscriptionInvoice[];
    },
  });
}

export function usePaySubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/subscription/invoices/pay');
      return res.data.data as { checkoutUrl: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useChangeSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: 'monthly' | 'annual') => {
      const res = await api.patch('/subscription/plan', { plan });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
