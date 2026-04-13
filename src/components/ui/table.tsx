import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Column<T = any> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Column<any>[];
  data: T[];
  keyField?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = 'id',
  emptyMessage = 'No data found',
  onRowClick,
  loading,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-3.5 text-left text-[12px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    <div className="skeleton h-3.5 rounded" style={{ width: `${60 + (i * 13 + col.key.length * 7) % 35}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3.5 text-left text-[12px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-14 text-center text-sm text-slate-400 dark:text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={item[keyField] as string}
                style={{ animationDelay: `${idx * 30}ms` }}
                className={[
                  'border-b border-slate-50 dark:border-slate-800/50 transition-colors animate-fade-in opacity-0',
                  '[animation-fill-mode:forwards]',
                  onRowClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30',
                  idx === data.length - 1 ? 'border-b-0' : '',
                ].join(' ')}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-[13px] text-slate-700 dark:text-slate-300">
                    {col.render ? col.render(item) : (item[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
