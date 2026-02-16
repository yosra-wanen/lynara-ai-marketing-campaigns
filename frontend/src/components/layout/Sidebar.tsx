'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Contact,
  FileText,
  FolderOpen,
  ClipboardList,
  Clock,
  Settings,
  BarChart3,
  Workflow,
  LogOut,
  CircleDollarSign,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/providers/I18nProvider';
import { useSection, SectionType } from '@/providers/SectionProvider';

export interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

export interface SidebarSection {
  titleKey: string;
  items: NavItem[];
}

const crmMenuItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/clients', labelKey: 'clients', icon: <Users size={20} /> },
  { href: '/contacts', labelKey: 'contacts', icon: <Contact size={20} /> },
  { href: '/proposals', labelKey: 'proposals', icon: <FileText size={20} /> },
  { href: '/contracts', labelKey: 'contracts', icon: <FolderOpen size={20} /> },
  { href: '/forms', labelKey: 'forms', icon: <ClipboardList size={20} /> },
  { href: '/scheduling', labelKey: 'scheduling', icon: <Clock size={20} /> },
];

const crmExploreItems: NavItem[] = [
  { href: '/reports', labelKey: 'reports', icon: <BarChart3 size={20} /> },
  { href: '/automations', labelKey: 'automations', icon: <Workflow size={20} /> },
  { href: '/settings', labelKey: 'settings', icon: <Settings size={20} /> },
];

const catalogueMenuItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/services', labelKey: 'services', icon: <ShoppingBag size={20} /> }, // Services as Products
  { href: '/accounting', labelKey: 'accounting', icon: <CircleDollarSign size={20} /> },
];

const catalogueExploreItems: NavItem[] = [
  { href: '/reports', labelKey: 'reports', icon: <BarChart3 size={20} /> },
  { href: '/automations', labelKey: 'automations', icon: <Workflow size={20} /> },
  { href: '/settings', labelKey: 'settings', icon: <Settings size={20} /> },
];

export interface SidebarProps {
  appName?: string;
  projectVersion?: string;
  className?: string;
}

export function Sidebar({
  appName,
  projectVersion,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { activeSection } = useSection();

  const menuItems = activeSection === 'crm' ? crmMenuItems : catalogueMenuItems;
  const exploreItems = activeSection === 'crm' ? crmExploreItems : catalogueExploreItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r md:flex',
        'border-gray-100 dark:border-[#262626]',
        'bg-white dark:bg-black',
        'shadow-sm dark:shadow-none',
        className
      )}
    >
      {/* Logo - violet #a079ff comme capture */}
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-[#262626] p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-logo-accent text-white font-bold shadow-lg shadow-[#A079FF]/25 dark:shadow-[#A079FF]/15 transition-all duration-300">
          L
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">
            {appName ?? t('common', 'appName')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {projectVersion ?? t('common', 'projectVersion')}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <SidebarSection titleKey="menu" items={menuItems} pathname={pathname} activeSection={activeSection} />
        <SidebarSection titleKey="explore" items={exploreItems} pathname={pathname} activeSection={activeSection} />
      </nav>

      {/* Footer - Logout only; profile is in header avatar menu */}
      <div className="border-t border-gray-100 dark:border-[#262626] p-4">
        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
        >
          <LogOut size={18} />
          {t('sidebar', 'logout')}
        </Link>
      </div>
    </aside>
  );
}

function SidebarSection({
  titleKey,
  items,
  pathname,
}: {
  titleKey: string;
  items: NavItem[];
  pathname: string;
  activeSection: SectionType;
}) {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#808080]">
        {t('sidebar', titleKey)}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 [&_svg]:shrink-0',
                  isActive
                    ? 'font-semibold bg-nav-active text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                {item.icon}
                {t('sidebar', item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
