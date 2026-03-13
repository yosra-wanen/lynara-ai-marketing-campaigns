'use client';

import { useState } from 'react';
import { Sparkles, Upload, Paperclip } from 'lucide-react';
import {
  Button,
  Card,
  TextAreaWithSuggestion,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function DashboardPage() {
  const [value, setValue] = useState('');
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white dark:bg-[#1E1E1E] p-8 shadow-card border border-[#E2E8F0] dark:border-white/5 hover:shadow-card-hover transition-shadow duration-300">
        <div className="mb-6 flex items-start gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 shadow-lg shadow-[#A079FF]/15">
            <Sparkles size={40} className="text-[#7C4DFF] dark:text-[#B394FF]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
              {t('dashboard', 'title')}
            </h2>
            <p className="mt-2 text-[#64748B] dark:text-[#B0B0B0]">
              {t('dashboard', 'description')}
            </p>
          </div>
        </div>

        <TextAreaWithSuggestion
          label={t('dashboard', 'templateLabel')}
          placeholder={t('dashboard', 'placeholder')}
          value={value}
          onChange={setValue}
          onSuggest={() => setValue('Exemple de suggestion...')}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#7C4DFF] dark:hover:text-[#B394FF] transition-colors">
              <Upload size={18} />
              {t('dashboard', 'uploadImage')}
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#7C4DFF] dark:hover:text-[#B394FF] transition-colors">
              <Paperclip size={18} />
              {t('dashboard', 'addAttachment')}
            </button>
          </div>
          <Button leftIcon={<Sparkles size={18} />}>
            {t('dashboard', 'generateWithAI')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[#64748B] dark:text-[#94A3B8]">
            {t('dashboard', 'activeCampaigns')}
          </h3>
          <p className="mt-2 text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">12</p>
        </Card>
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[#64748B] dark:text-[#94A3B8]">
            {t('dashboard', 'leads')}
          </h3>
          <p className="mt-2 text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">1,234</p>
        </Card>
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[#64748B] dark:text-[#94A3B8]">
            {t('dashboard', 'conversionRate')}
          </h3>
          <p className="mt-2 text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">24%</p>
        </Card>
      </div>
    </div>
  );
}
