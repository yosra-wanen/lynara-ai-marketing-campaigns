'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export interface MainLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
}

import { SectionProvider } from '@/providers/SectionProvider';

export function MainLayout({
  children,
  headerTitle,
  headerSubtitle,
  headerAction,
  className,
}: MainLayoutProps) {
  return (
    <SectionProvider>
      <div className="min-h-screen bg-white dark:bg-black">
        <Sidebar />
        <div className="md:pl-[260px] min-h-screen bg-[var(--color-bg-page-tint)] dark:bg-black">
          <Header
            title={headerTitle}
            subtitle={headerSubtitle}
            actionButton={headerAction}
            userName="James Passaquindici"
            userId="4827682"
          />
          <main className={cn('p-6', className)}>{children}</main>
        </div>
      </div>
    </SectionProvider>
  );
}
