import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Wallet, WalletTransaction } from '../../types';

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
