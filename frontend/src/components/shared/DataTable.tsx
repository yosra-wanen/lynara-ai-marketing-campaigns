'use client';

import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableProps<T extends object = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  onRowAction?: (row: T) => void;
  avatarKey?: string;
  avatarFallbackKey?: string;
  className?: string;
}

export function DataTable<T extends object = Record<string, unknown>>({
  columns,
  data,
  onRowAction,
  avatarKey,
  avatarFallbackKey,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-3xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#121212] shadow-card', className)}>
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-[#262626] bg-gray-50/50 dark:bg-[#1A1A1A]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white"
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && <ArrowUpDown size={16} className="text-gray-400 dark:text-gray-500" />}
                </div>
              </th>
            ))}
            {onRowAction && (
              <th className="w-12 px-4 py-4"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-50 dark:border-[#262626] transition-colors last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#1A1A1A]"
            >
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[col.key];
                return (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {col.render ? (
                      col.render(value, row)
                    ) : col.key === avatarKey && avatarFallbackKey ? (
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={value as string | null}
                          fallback={(row as Record<string, unknown>)[avatarFallbackKey] as string}
                          size="sm"
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {(row as Record<string, unknown>)[avatarFallbackKey] as string}
                        </span>
                      </div>
                    ) : (
                      String(value ?? '-')
                    )}
                  </td>
                );
              })}
              {onRowAction && (
                <td className="px-4 py-4">
                  <button
                    onClick={() => onRowAction(row)}
                    className="rounded-lg p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
