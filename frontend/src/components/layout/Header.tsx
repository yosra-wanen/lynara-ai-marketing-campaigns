'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Search, ChevronDown, User, LogOut, Building2, Plus, Sun, Moon, Globe } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { SectionSwitcher } from '@/components/ui/SectionSwitcher';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/providers/I18nProvider';
import { locales, localeNames, type Locale } from '@/lib/i18n';

export interface EnterpriseItem {
  id: string;
  name: string;
  role?: 'OWNER' | 'ADMIN';
  description?: string;
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  userName?: string;
  userAvatar?: string | null;
  userId?: string;
  showSearch?: boolean;
  actionButton?: React.ReactNode;
  enterprises?: EnterpriseItem[];
  currentEnterpriseId?: string;
  className?: string;
}

const defaultEnterprises: EnterpriseItem[] = [
  { id: '1', name: 'Client Management', role: 'OWNER', description: 'Gestion clients' },
  { id: '2', name: 'Acme Corp', role: 'ADMIN', description: 'Import / Export' },
];

export function Header({
  title,
  subtitle,
  searchPlaceholder,
  userName = 'Utilisateur',
  userAvatar,
  userId,
  showSearch = true,
  actionButton,
  enterprises = defaultEnterprises,
  currentEnterpriseId,
  className,
}: HeaderProps) {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const enterpriseRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const currentId = currentEnterpriseId ?? enterprises[0]?.id;
  const currentEnterprise = enterprises.find((e) => e.id === currentId) ?? enterprises[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (enterpriseRef.current && !enterpriseRef.current.contains(e.target as Node)) setEnterpriseOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = theme === 'dark';

  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b px-4 py-3 md:px-6 md:flex-row md:items-center md:justify-between',
        'border-gray-100 dark:border-[#262626]',
        'bg-white dark:bg-black',
        className
      )}
    >
      {/* Left - Enterprise + Module */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <div className="relative" ref={enterpriseRef}>
          <button
            type="button"
            onClick={() => setEnterpriseOpen(!enterpriseOpen)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            <h1 className="font-bold text-gray-900 dark:text-white text-base">
              {title ?? currentEnterprise?.name ?? t('header', 'clientManagement')}
            </h1>
            <ChevronDown size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
          </button>
          {enterpriseOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-60 rounded-2xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#121212] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] py-3 z-50 animate-dropdown-in origin-top-left"
              style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)' }}
            >
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('header', 'enterprises')}
              </p>
              {enterprises.map((ent, i) => (
                <Link
                  key={ent.id}
                  href="/dashboard"
                  onClick={() => setEnterpriseOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-all duration-200 animate-dropdown-item opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: `${40 + i * 35}ms` }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF] dark:text-[#B394FF]">
                    <Building2 size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{ent.name}</span>
                </Link>
              ))}
              <Link
                href="/create-enterprise"
                onClick={() => setEnterpriseOpen(false)}
                className="mx-2 mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#7C4DFF] dark:text-[#B394FF] hover:bg-[#E8E0FF] dark:hover:bg-[#A079FF]/20 transition-all duration-200 animate-dropdown-item opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${40 + enterprises.length * 35}ms` }}
              >
                <Plus size={18} className="shrink-0" />
                {t('header', 'createEnterprise')}
              </Link>
            </div>
          )}
        </div>
        {(subtitle ?? t('header', 'freePlan')) && (
          <p className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
            {subtitle ?? t('header', 'freePlan')}
          </p>
        )}
        <div className="hidden h-6 w-px bg-gray-200 dark:bg-gray-800 md:block" />
        <SectionSwitcher />
      </div>

      {/* Right - Search + user menu (no filter, no standalone theme/lang) */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {showSearch && (
          <div className="w-full min-w-0 md:w-52 lg:w-64 order-last md:order-none">
            <Input
              placeholder={searchPlaceholder ?? t('header', 'searchPlaceholder')}
              leftIcon={<Search size={18} />}
            />
          </div>
        )}
        {actionButton}
        <div className="relative border-l border-gray-100 dark:border-[#262626] pl-3 md:pl-4" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg py-1 pr-1 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
              {userId && (
                <p className="text-xs text-gray-400 dark:text-gray-500">N° {userId}</p>
              )}
            </div>
            <Avatar src={userAvatar} fallback={userName} size="md" className="shrink-0 ring-2 ring-gray-100 dark:ring-[#262626]" />
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#121212] py-3 z-50 animate-dropdown-in origin-top-right"
              style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)' }}
            >
              <div className="px-4 py-2 border-b border-gray-100 dark:border-[#262626] sm:hidden animate-dropdown-item opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '20ms' }}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
                {userId && <p className="text-xs text-gray-400 dark:text-gray-500">N° {userId}</p>}
              </div>

              {/* Enterprises - contenu plateforme (canaux / espaces) */}
              <div className="px-2 py-3">
                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t('header', 'enterprises')}
                </p>
                <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                  {enterprises.map((ent, i) => (
                    <li key={ent.id}>
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-all duration-200 animate-dropdown-item opacity-0 [animation-fill-mode:forwards]"
                        style={{ animationDelay: `${50 + i * 35}ms` }}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF] dark:text-[#B394FF]">
                          <Building2 size={18} />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white truncate">{ent.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/create-enterprise"
                  onClick={() => setProfileOpen(false)}
                  className="mx-1 mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#7C4DFF] dark:text-[#B394FF] hover:bg-[#E8E0FF] dark:hover:bg-[#A079FF]/20 transition-all animate-dropdown-item opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: `${50 + enterprises.length * 35}ms` }}
                >
                  <Plus size={18} />
                  {t('header', 'createEnterprise')}
                </Link>
              </div>

              <div className="border-t border-gray-100 dark:border-[#262626] my-2" />
              <div className="px-2 space-y-1">
                <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors animate-dropdown-item opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: `${120}ms` }}>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Sun size={14} className="opacity-70" />
                    {t('header', 'theme')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="rounded-xl p-2 border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors"
                    aria-label={isDark ? 'Light' : 'Dark'}
                  >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors animate-dropdown-item opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '160ms' }}>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Globe size={14} className="opacity-70" />
                    {t('header', 'language')}
                  </span>
                  <div className="flex gap-1">
                    {locales.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLocale(l)}
                        className={cn(
                          'rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                          locale === l
                            ? 'bg-tab-active text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
                        )}
                      >
                        {localeNames[l]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-[#262626] my-2" />
              <div className="px-2 space-y-0.5">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-all animate-dropdown-item opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: '200ms' }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#1A1A1A]">
                    <User size={18} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  {t('header', 'myProfile')}
                </Link>
                <Link
                  href="/logout"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-all animate-dropdown-item opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: '240ms' }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#1A1A1A]">
                    <LogOut size={18} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  {t('header', 'logout')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
