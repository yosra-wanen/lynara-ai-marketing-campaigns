'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  PageHeader,
  Button,
  SearchInput,
  Card,
} from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function FormsPage() {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('forms', 'title')}
          subtitle={t('forms', 'subtitle')}
        />
        <Button leftIcon={<Plus size={18} />}>{t('forms', 'addForm')}</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder={t('forms', 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <Card variant="elevated" padding="lg">
        <p className="text-[#64748B] dark:text-[#94A3B8]">
          Liste des formulaires. Utilisez la recherche ou le bouton ci-dessus pour créer un nouveau formulaire.
        </p>
      </Card>
    </div>
  );
}
