'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Instagram,
  BarChart3,
  ScrollText,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/admin',           label: 'Dashboard',           icon: <LayoutDashboard size={18} /> },
  { href: '/admin/users',     label: 'Utilisateurs',        icon: <Users size={18} /> },
  { href: '/admin/campaigns', label: 'Campagnes',           icon: <Megaphone size={18} /> },
  { href: '/admin/instagram', label: 'Comptes Instagram',   icon: <Instagram size={18} /> },
  { href: '/admin/analytics', label: 'Analytics',           icon: <BarChart3 size={18} /> },
  { href: '/admin/logs',      label: 'Journaux système',    icon: <ScrollText size={18} /> },
  { href: '/admin/settings',  label: 'Paramètres',          icon: <Settings size={18} /> },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r md:flex border-gray-100 dark:border-[#262626] bg-white dark:bg-black shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-[#262626] p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C4DFF] text-white font-bold shadow-lg shadow-[#7C4DFF]/25">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">Lynara Admin</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Panneau d'administration</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#808080]">
          Administration
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 [&_svg]:shrink-0',
                    isActive
                      ? 'font-semibold bg-[#7C4DFF]/10 text-[#7C4DFF] dark:text-[#A079FF]'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Back to app */}
        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#808080]">
            Application
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200"
          >
            <LayoutDashboard size={18} />
            Retour au Dashboard
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-[#262626] p-4">
        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
        >
          <LogOut size={18} />
          Déconnexion
        </Link>
      </div>
    </aside>
  );
}
