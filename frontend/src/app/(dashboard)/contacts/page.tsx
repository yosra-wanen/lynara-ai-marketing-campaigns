'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  DataTable,
  Avatar,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

interface Contact {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  company: string;
}

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Carter Calzoni',
    email: 'raihan@ofspace.agency',
    jobTitle: 'Chief executive officer',
    company: 'eBay',
  },
  {
    id: '2',
    name: 'Marie Dupont',
    email: 'marie@mastercard.com',
    jobTitle: 'Marketing Director',
    company: 'MasterCard',
  },
];

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const columns = [
    {
      key: 'avatar',
      label: t('contacts', 'contactName'),
      render: (_: unknown, row: Contact) => (
        <div className="flex items-center gap-3">
          <Avatar fallback={row.name} size="sm" />
          <span className="font-medium text-[#1E293B] dark:text-[#F5F5F5]">{row.name}</span>
        </div>
      ),
    },
    { key: 'email', label: t('contacts', 'email'), sortable: true },
    { key: 'jobTitle', label: t('contacts', 'jobTitle'), sortable: true },
    { key: 'company', label: t('contacts', 'company'), sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('contacts', 'title')}
          subtitle={t('contacts', 'subtitle')}
        />
        <Button leftIcon={<Plus size={18} />}>{t('contacts', 'newContact')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('common', 'search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <DataTable columns={columns} data={mockContacts} onRowAction={() => {}} />
    </div>
  );
}
