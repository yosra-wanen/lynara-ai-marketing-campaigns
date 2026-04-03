'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header, type EnterpriseItem } from './Header';
import { cn } from '@/lib/utils';
import { SectionProvider } from '@/providers/SectionProvider';
import { SupabaseService } from '@/app/services/supabase.service';

export interface MainLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
}

type CurrentUser = {
  id: string;
  full_name?: string | null;
};

export function MainLayout({
  children,
  headerTitle,
  headerSubtitle,
  headerAction,
  className,
}: MainLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [enterprises, setEnterprises] = useState<EnterpriseItem[]>([]);

  useEffect(() => {
    // Fetch current user profile
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/me`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw body.detail;
        return body;
      })
      .then((response) => {
        if (response?.data) {
          setUser({
            id: response.data.profile_id ?? response.data.id ?? '',
            full_name: response.data.full_name ?? response.data.name ?? '',
          });
        }
      })
      .catch(() => {
        // si non authentifié, on laisse les valeurs par défaut
      });

    // Fetch companies for the user
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw body.detail;
        return body;
      })
      .then((response) => {
        const companies = (response?.data || []).map((c: any) => ({
          id: c.company_id ?? c.id,
          name: c.legal_name ?? c.name,
        })) as EnterpriseItem[];
        setEnterprises(companies);
      })
      .catch(() => {
        // on garde la liste par défaut si erreur
      });
  }, []);

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
            userName={user?.full_name || 'Utilisateur'}
            userId={user?.id}
            enterprises={enterprises}
            onLogout={handleLogout}
          />
          <main className={cn('p-6', className)}>{children}</main>
        </div>
      </div>
    </SectionProvider>
  );
}
