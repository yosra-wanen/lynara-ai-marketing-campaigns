'use client';

import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header, type EnterpriseItem } from './Header';
import { cn } from '@/lib/utils';
import { SectionProvider } from '@/providers/SectionProvider';
import { SupabaseService } from '@/app/services/supabase.service';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface MainLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
}

export function MainLayout({
  children,
  headerTitle,
  headerSubtitle,
  headerAction,
  className,
}: MainLayoutProps) {
  const router = useRouter();
  const { userId, userName, enterprises: authEnterprises, companyId } = useAuth();

  const enterprises: EnterpriseItem[] = authEnterprises.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
  }));

  async function handleSwitchEnterprise(enterpriseId: string) {
    await supabase.auth.updateUser({ data: { active_company_id: enterpriseId } });
    router.refresh();
  }

  async function handleLogout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      const supabaseService = new SupabaseService();
      await supabaseService.killSession();
    } finally {
      router.push('/login');
    }
  }

  return (
    <SectionProvider>
      <div className="min-h-screen bg-white dark:bg-black relative">
        <Sidebar />
        <div className="md:pl-[260px] min-h-screen bg-[var(--color-bg-page-tint)] dark:bg-black relative z-10 pointer-events-auto">
          <Header
            title={headerTitle}
            subtitle={headerSubtitle}
            actionButton={headerAction}
            userName={userName || 'Utilisateur'}
            userId={userId ?? undefined}
            enterprises={enterprises}
            currentEnterpriseId={companyId ?? undefined}
            onSwitchEnterprise={handleSwitchEnterprise}
            onLogout={handleLogout}
          />
          <main className={cn('p-6', className)}>{children}</main>
        </div>
      </div>
    </SectionProvider>
  );
}
