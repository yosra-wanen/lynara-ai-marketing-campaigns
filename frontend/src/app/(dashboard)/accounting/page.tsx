'use client';

import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  Card,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function AccountingPage() {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('accounting', 'title')}
          subtitle={t('accounting', 'subtitle')}
        />
        <Button leftIcon={<Plus size={18} />}>{t('accounting', 'addEntry')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('accounting', 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Revenus</h3>
          <p className="mt-2 text-2xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">—</p>
        </Card>
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Dépenses</h3>
          <p className="mt-2 text-2xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">—</p>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[#7C4DFF] dark:text-[#B394FF]" />
            <h3 className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Solde</h3>
          </div>
          <p className="mt-2 text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">—</p>
        </Card>
      </div>

      <Card variant="elevated" padding="lg">
        <p className="text-[#64748B] dark:text-[#94A3B8]">
          Suivez vos finances. Utilisez le bouton ci-dessus pour ajouter une nouvelle entrée comptable.
        </p>
      </Card>
    </div>
  );
}
