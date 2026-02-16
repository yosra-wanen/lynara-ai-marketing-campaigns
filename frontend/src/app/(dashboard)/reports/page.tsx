'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  Card,
  Tabs,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { t } = useTranslation();

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'campaigns', label: 'Campagnes' },
    { id: 'exports', label: 'Exports' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('reports', 'title')}
          subtitle={t('reports', 'subtitle')}
        />
        <Button leftIcon={<FileText size={18} />}>{t('reports', 'generateReport')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('reports', 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <Card variant="elevated" padding="lg">
        <p className="text-[#64748B] dark:text-[#94A3B8]">
          Consultez vos rapports et analytics. Générez un rapport avec le bouton ci-dessus.
        </p>
      </Card>
    </div>
  );
}
