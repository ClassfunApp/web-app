import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Wallet, WalletTransaction, BankBeneficiary, Withdrawal, PaystackBank } from '../../types';

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data.data as Wallet;
    },
  });
}

export function useWalletTransactions(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['wallet', 'transactions', limit, offset],
    queryFn: async () => {
      const res = await api.get('/wallet/transactions', { params: { limit, offset } });
      return {
        data: res.data.data as WalletTransaction[],
        total: res.data.meta.total as number,
      };
    },
  });
}

// ── Banks ─────────────────────────────────────────────────────────────────────

export function useBanks() {
  return useQuery({
    queryKey: ['wallet', 'banks'],
    queryFn: async () => {
      const res = await api.get('/wallet/banks');
      return res.data.data as PaystackBank[];
    },
    staleTime: 24 * 60 * 60 * 1000, // cache for 24 h — bank list rarely changes
  });
}

// ── Beneficiaries ─────────────────────────────────────────────────────────────

export function useBeneficiaries() {
  return useQuery({
    queryKey: ['wallet', 'beneficiaries'],
    queryFn: async () => {
      const res = await api.get('/wallet/beneficiaries');
      return res.data.data as BankBeneficiary[];
    },
  });
}

export function useAddBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      accountNumber: string;
      bankCode: string;
      bankName: string;
      isDefault?: boolean;
    }) => {
      const res = await api.post('/wallet/beneficiaries', params);
      return res.data.data as BankBeneficiary;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'beneficiaries'] });
    },
  });
}

export function useDeleteBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wallet/beneficiaries/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'beneficiaries'] });
    },
  });
}

export function useSetDefaultBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/wallet/beneficiaries/${id}/default`);
      return res.data.data as BankBeneficiary;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'beneficiaries'] });
    },
  });
}

// ── Withdrawals ───────────────────────────────────────────────────────────────

export function useWithdrawals(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['wallet', 'withdrawals', limit, offset],
    queryFn: async () => {
      const res = await api.get('/wallet/withdrawals', { params: { limit, offset } });
      return {
        data: res.data.data as Withdrawal[],
        total: res.data.meta.total as number,
      };
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      beneficiaryId: string;
      amount: number;
      reason?: string;
    }) => {
      const res = await api.post('/wallet/withdraw', params);
      return res.data.data as Withdrawal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
