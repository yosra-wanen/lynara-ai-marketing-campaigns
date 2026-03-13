'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  Card,
  Badge,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function ServicesPage() {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('services', 'title')}
          subtitle={t('services', 'subtitle')}
        />
        <Button leftIcon={<Plus size={18} />}>{t('services', 'addService')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('services', 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1E293B] dark:text-[#F5F5F5]">Email</h3>
            <Badge variant="success">Actif</Badge>
          </div>
          <p className="mt-2 text-sm text-[#64748B] dark:text-[#94A3B8]">Campagnes email</p>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1E293B] dark:text-[#F5F5F5]">WhatsApp</h3>
            <Badge variant="success">Actif</Badge>
          </div>
          <p className="mt-2 text-sm text-[#64748B] dark:text-[#94A3B8]">Messagerie WhatsApp</p>
        </Card>
      </div>
    </div>
  );
}
