'use client';

import { useState } from 'react';
import { Plus, Workflow } from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  Card,
  Badge,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function AutomationsPage() {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('automations', 'title')}
          subtitle={t('automations', 'subtitle')}
        />
        <Button leftIcon={<Plus size={18} />}>{t('automations', 'addAutomation')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('automations', 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <Card variant="elevated" padding="lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0FDF9] dark:bg-[#1E3D35]">
            <Workflow size={24} className="text-[#7C4DFF] dark:text-[#B394FF]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1E293B] dark:text-[#F5F5F5]">Workflows</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Configurez vos automatisations et workflows.</p>
          </div>
          <Badge variant="outline" className="ml-auto">0 actifs</Badge>
        </div>
      </Card>
    </div>
  );
}
