'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .schema('core')
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.replace('/dashboard');
        return;
      }

      setReady(true);
    }
    checkAdmin();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C4DFF]" />
          <p className="text-sm text-gray-500">Vérification des droits admin…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <AdminSidebar />
      <div className="md:pl-[260px] min-h-screen">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
