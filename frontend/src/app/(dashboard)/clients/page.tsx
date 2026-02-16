'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  DataTable,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

interface Client {
  id: string;
  name: string;
  contactName: string;
  email: string;
  description: string;
}

const mockData: Client[] = [
  {
    id: '1',
    name: 'Ofspace Digital Agency',
    contactName: 'Shekh Al Raihan',
    email: 'raihan@ofspace.agency',
    description: 'Agence UI/UX design...',
  },
  {
    id: '2',
    name: 'FIK Fikri Studio',
    contactName: 'Jean Dupont',
    email: 'jean@fikstudio.com',
    description: 'Studio créatif...',
  },
  {
    id: '3',
    name: 'Dipa Inhouse',
    contactName: 'Marie Martin',
    email: 'marie@dipa.com',
    description: 'Solutions digitales...',
  },
];

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const columns = [
    { key: 'name', label: t('clients', 'clientName'), sortable: true },
    { key: 'contactName', label: t('clients', 'contactName'), sortable: true },
    { key: 'email', label: t('clients', 'email'), sortable: true },
    {
      key: 'description',
      label: t('clients', 'description'),
      render: (val: unknown) => (
        <span className="max-w-[200px] truncate block text-[#1E293B] dark:text-[#F5F5F5]">
          {String(val)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('clients', 'title')}
          subtitle={t('clients', 'subtitle')}
        />
        <Button leftIcon={<Plus size={18} />}>{t('clients', 'addClient')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('common', 'search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <DataTable
        columns={columns}
        data={mockData}
        onRowAction={(row) => console.log('Action:', row)}
      />
    </div>
  );
}
