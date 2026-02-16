'use client';

import { useState } from 'react';
import { PageHeader, Card, Button, Input, Avatar, Tabs } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';
import { Upload, Instagram, Globe } from 'lucide-react';

export default function ProfileMePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: t('profile', 'personalInfo') },
    { id: 'connected', label: t('profile', 'connectedAccounts') },
    { id: 'security', label: t('profile', 'security') },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <PageHeader
        title={t('profile', 'title')}
        subtitle={t('profile', 'subtitle')}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'personal' && (
        <Card variant="elevated" padding="lg" className="space-y-8 rounded-2xl border border-gray-100 dark:border-[#262626] shadow-card">
          <div className="flex items-center gap-6">
            <Avatar size="xl" src={null} fallback="RD" className="ring-2 ring-gray-100 dark:ring-[#262626]" />
            <div>
              <Button variant="outline" leftIcon={<Upload size={16} />}>
                {t('profile', 'uploadAvatar')}
              </Button>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                JPG, GIF or PNG. Max size of 800K
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">{t('profile', 'fullName')}</label>
              <Input defaultValue="Robbi Darwis" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">{t('profile', 'email')}</label>
              <Input defaultValue="robbidarwis@flowforge.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">{t('profile', 'phone')}</label>
              <Input defaultValue="+62 812 3456 7890" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">{t('profile', 'language')}</label>
              <Input defaultValue="English" />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-[#262626] pt-6">
            <Button variant="outline">{t('profile', 'cancel')}</Button>
            <Button>{t('profile', 'saveChanges')}</Button>
          </div>
        </Card>
      )}

      {activeTab === 'connected' && (
        <Card variant="elevated" padding="lg" className="space-y-6 rounded-2xl border border-gray-100 dark:border-[#262626]">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262626] pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tab-active text-white">
                <Instagram size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Instagram</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connecté en tant que @lynara_app</p>
              </div>
            </div>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30">
              {t('profile', 'disconnect')}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-700 dark:bg-gray-600 text-white">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Google</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Non connecté</p>
              </div>
            </div>
            <Button variant="primary">{t('profile', 'connect')}</Button>
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card variant="elevated" padding="lg" className="space-y-6 rounded-2xl border border-gray-100 dark:border-[#262626]">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile', 'deleteAccount')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('profile', 'deleteWarning')}</p>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20">
              {t('profile', 'deleteAccount')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
