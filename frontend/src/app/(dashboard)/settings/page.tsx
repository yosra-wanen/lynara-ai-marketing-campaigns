'use client';

import { useState } from 'react';
import {
  PageHeader,
  Button,
  SearchInput,
  Card,
  Tabs,
  Input,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function SettingsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const { t } = useTranslation();

  const tabs = [
    { id: 'general', label: 'Général' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Sécurité' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('settings', 'title')}
          subtitle={t('settings', 'subtitle')}
        />
        <Button>{t('settings', 'save')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('settings', 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <Card variant="elevated" padding="lg">
        <div className="space-y-4 max-w-md">
          <Input placeholder="Nom de l'organisation" />
          <Input placeholder="Email de contact" type="email" />
        </div>
      </Card>
    </div>
  );
}
