export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  if (currency === 'USD') return `$${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: string | Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '—';
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-400',
    trial: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400',
    suspended: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400',
    inactive: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-400',
    archived: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-400',
    pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-400',
    paid: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-400',
    overdue: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400',
    completed: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400',
    dropped: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-400',
    sent: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400',
    delivered: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-400',
    failed: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400',
    // verification statuses
    submitted: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400',
    approved: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-400',
    rejected: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-400';
}
