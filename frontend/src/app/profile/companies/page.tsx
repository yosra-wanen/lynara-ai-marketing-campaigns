'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input, Button, Avatar, Badge } from '@/components';
import { Search, Plus, Eye, MoreVertical, LogIn } from 'lucide-react';
import { TranslationService } from '@/app/services/translation.service';
import { ToastService } from '@/app/services/toast.service';

type Company = {
  company_id: string;
  legal_name: string;
  industry:   string | null;
  email:      string | null;
  country:    string;
  logo_url:   string | null;
  role:       string;
  status:     string;
};

export default function ProfileCompaniesPage() {
  const translator   = new TranslationService();
  const toastService = new ToastService();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  const fetchCompanies = () => {
    if (companies.length === 0) setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/me`, {
      method:      'GET',
      credentials: 'include',
    })
    .then(async res => {
      const body = await res.json();
      if (!res.ok) throw body.detail;
      return body;
    })
    .then((response) => {
      setCompanies(response.data || []);
    })
    .catch(() => {
      toastService.displayToast(translator.translate('profile', 'fetchError'), 'error');
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompanies(); }, []);

  const filtered = companies.filter((c) =>
    c.legal_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6 mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translator.translate('profile', 'yourCompanies')} ({filtered.length})
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center w-full sm:w-auto">
          <div className="flex-1 sm:min-w-[260px] sm:max-w-sm">
            <Input
              placeholder={translator.translate('profile', 'searchCompanies')}
              leftIcon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/create-enterprise" className="shrink-0">
            <Button variant="primary" leftIcon={<Plus size={18} />} className="w-full sm:w-auto">
              {translator.translate('profile', 'addCompany')}
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 dark:text-gray-400">
            {translator.translate('profile', 'loading')}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-gray-500 dark:text-gray-400">
            {translator.translate('profile', 'noCompanies')}
          </p>
          <Link href="/create-enterprise">
            <Button variant="primary" leftIcon={<Plus size={18} />}>
              {translator.translate('profile', 'addCompany')}
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {filtered.map((company) => (
            <li
              key={company.company_id}
              className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 p-6 rounded-2xl border border-gray-100 dark:border-[#262626] bg-gray-50/50 dark:bg-[#121212] hover:border-gray-200 dark:hover:border-[#333] transition-colors"
            >
              <div className="flex items-center gap-5 min-w-0 flex-1">
                <Avatar
                  fallback={company.legal_name.slice(0, 2).toUpperCase()}
                  size="lg"
                  className="shrink-0 bg-[#E8E0FF] dark:bg-[#A079FF]/25 text-[#7C4DFF] dark:text-[#B394FF] font-bold"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-bold text-gray-900 dark:text-white truncate">
                      {company.legal_name}
                    </h2>
                    <Badge
                      variant={company.role === 'owner' ? 'warning' : 'default'}
                      className="shrink-0 text-xs"
                    >
                      {company.role === 'owner'
                        ? translator.translate('profile', 'owner')
                        : translator.translate('profile', 'admin')
                      }
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {company.industry || company.email || company.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <Button variant="outline" size="sm" leftIcon={<Eye size={16} />}>
                  {translator.translate('profile', 'viewDetails')}
                </Button>
                <Button variant="outline" size="sm" leftIcon={<MoreVertical size={16} />}>
                  {translator.translate('profile', 'actions')}
                </Button>
                <Link href="/dashboard">
                  <Button variant="primary" size="sm" leftIcon={<LogIn size={16} />}>
                    {translator.translate('profile', 'openCompany')}
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}