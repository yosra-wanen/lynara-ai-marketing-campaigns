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
import { useAuth } from '@/hooks/useAuth';

export function MainLayout({
  children,
  headerTitle,
  headerSubtitle,
  headerAction,
  className,
}: MainLayoutProps) {
  const { userName, companyName, companyId, enterprises } = useAuth();

  return (
    <SectionProvider>
      <div className="min-h-screen bg-white dark:bg-black">
        <Sidebar />
        <div className="md:pl-[260px] min-h-screen bg-[var(--color-bg-page-tint)] dark:bg-black">
          <Header
            title={headerTitle || companyName || "Mon Entreprise"}
            subtitle={headerSubtitle}
            actionButton={headerAction}
            userName={userName || "Invité"}
            userId={companyId?.slice(0, 8)}
            enterprises={enterprises}
            currentEnterpriseId={companyId || undefined}
          />
          <main className={cn('p-6', className)}>{children}</main>
        </div>
      </div>
    </SectionProvider>
  );
}

