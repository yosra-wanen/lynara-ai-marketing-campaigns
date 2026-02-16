'use client';

import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  Card,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function SchedulingPage() {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('scheduling', 'title')}
          subtitle={t('scheduling', 'subtitle')}
        />
        <Button leftIcon={<Plus size={18} />}>{t('scheduling', 'addSchedule')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('scheduling', 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" size="sm" leftIcon={<Calendar size={16} />}>
          <span className="hidden sm:inline">Dec 12, 2024</span>
        </Button>
      </div>

      <Card variant="elevated" padding="lg">
        <p className="text-[#64748B] dark:text-[#94A3B8]">
          Planification des campagnes. Utilisez la recherche ou le bouton ci-dessus pour créer une nouvelle planification.
        </p>
      </Card>
    </div>
  );
}
