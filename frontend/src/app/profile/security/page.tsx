'use client';

import { PageHeader, Card, Button } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function ProfileSecurityPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <PageHeader title={t('profile', 'navSecurity')} subtitle={t('profile', 'navSecurityDesc')} />
      <Card variant="elevated" padding="lg" className="rounded-2xl">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('profile', 'deleteWarning')}</p>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30">
          {t('profile', 'deleteAccount')}
        </Button>
      </Card>
    </div>
  );
}
