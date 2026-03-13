'use client';

import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <h1 className="text-2xl font-bold text-[#1E293B] dark:text-[#F5F5F5] md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-[#64748B] dark:text-[#B0B0B0]">{subtitle}</p>}
    </div>
  );
}
