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

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'annual';

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  status: 'trial' | 'active' | 'suspended';
  phase: 'trial' | 'notice' | 'active' | 'suspended';
  accessAllowed: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  noticeDaysRemaining: number | null;
  noticePeriodEndsAt: string | null;
  renewalAnchorDate: string | null;
  childCount: number;
  billingRegion: string;
  billingCurrency: string;
  monthlyAmount: number;
  quarterlyAmount: number;
  annualAmount: number;
  currentCycle: { start: string; end: string; period: string } | null;
  nextInvoice: {
    period: string;
    amount: number;
    dueDate: string;
  } | null;
  outstandingInvoice: SubscriptionInvoice | null;
  wallet: { balance: number; currency: string };
  paymentProvider: 'paystack' | 'flutterwave';
}

export type PaySubscriptionResult =
  | { method: 'wallet'; success: true; invoice: SubscriptionInvoice }
  | { method: 'gateway'; checkoutUrl: string; reference: string; provider: string };

export function useSubscriptionStatus(enabled = true) {
  return useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: async () => {
      const res = await api.get('/subscription');
      return res.data.data as SubscriptionStatus;
    },
    enabled,
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
    mutationFn: async (method: 'wallet' | 'gateway' = 'gateway') => {
      const res = await api.post('/subscription/invoices/pay', { method });
      return res.data.data as PaySubscriptionResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useChangeSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const res = await api.patch('/subscription/plan', { plan });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
