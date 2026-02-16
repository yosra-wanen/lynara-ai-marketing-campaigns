'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input, Button, Avatar, Badge } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';
import { Search, Plus, Eye, MoreVertical, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockCompanies = [
  { id: '1', name: 'azerty', role: 'OWNER' as const, description: 'importExport' },
  { id: '2', name: 'Navinspire IA', role: 'ADMIN' as const, description: 'Commerciale' },
];

export default function ProfileCompaniesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const companies = mockCompanies.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6 mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('profile', 'yourCompanies')} ({companies.length})
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center w-full sm:w-auto">
          <div className="flex-1 sm:min-w-[260px] sm:max-w-sm">
            <Input
              placeholder={t('profile', 'searchCompanies')}
              leftIcon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/create-enterprise" className="shrink-0">
            <Button variant="primary" leftIcon={<Plus size={18} />} className="w-full sm:w-auto">
              {t('profile', 'addCompany')}
            </Button>
          </Link>
        </div>
      </div>

      <ul className="space-y-5">
        {companies.map((company) => (
          <li
            key={company.id}
            className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 p-6 rounded-2xl border border-gray-100 dark:border-[#262626] bg-gray-50/50 dark:bg-[#121212] hover:border-gray-200 dark:hover:border-[#333] transition-colors"
          >
            <div className="flex items-center gap-5 min-w-0 flex-1">
              <Avatar
                fallback={company.name.slice(0, 2).toUpperCase()}
                size="lg"
                className="shrink-0 bg-[#E8E0FF] dark:bg-[#A079FF]/25 text-[#7C4DFF] dark:text-[#B394FF] font-bold"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-bold text-gray-900 dark:text-white truncate">
                    {company.name}
                  </h2>
                  <Badge
                    variant={company.role === 'OWNER' ? 'warning' : 'default'}
                    className="shrink-0 text-xs"
                  >
                    {company.role === 'OWNER' ? t('profile', 'owner') : t('profile', 'admin')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {company.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Button variant="outline" size="sm" leftIcon={<Eye size={16} />}>
                {t('profile', 'viewDetails')}
              </Button>
              <Button variant="outline" size="sm" leftIcon={<MoreVertical size={16} />}>
                {t('profile', 'actions')}
              </Button>
              <Link href="/dashboard">
                <Button variant="primary" size="sm" leftIcon={<LogIn size={16} />}>
                  {t('profile', 'openCompany')}
                </Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>Per page:</span>
        <select className="rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-1.5 text-gray-900 dark:text-white">
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  );
}
