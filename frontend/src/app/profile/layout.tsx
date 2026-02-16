'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Building2, User, Shield, CreditCard, Mail } from 'lucide-react';
import { useTranslation } from '@/providers/I18nProvider';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/profile/companies', icon: Building2, labelKey: 'navCompanies', descKey: 'navCompaniesDesc' },
  { href: '/profile/me', icon: User, labelKey: 'navProfile', descKey: 'navProfileDesc' },
  { href: '/profile/security', icon: Shield, labelKey: 'navSecurity', descKey: 'navSecurityDesc' },
  { href: '/profile/subscription', icon: CreditCard, labelKey: 'navSubscription', descKey: 'navSubscriptionDesc' },
  { href: '/profile/invitations', icon: Mail, labelKey: 'navInvitations', descKey: 'navInvitationsDesc' },
] as const;

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-black flex">
      {/* Sidebar - like capture */}
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-100 dark:border-[#262626] bg-gray-50/50 dark:bg-[#0A0A0A]">
        <div className="p-5 border-b border-gray-100 dark:border-[#262626]">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={18} />
            Retour
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map(({ href, icon: Icon, labelKey, descKey }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-start gap-3.5 rounded-xl px-4 py-3.5 transition-all duration-200',
                  isActive
                    ? 'bg-nav-active text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
                )}
              >
                <Icon size={20} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{t('profile', labelKey)}</p>
                  <p className={cn('text-xs mt-1 truncate', isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400')}>
                    {t('profile', descKey)}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
