'use client';

import { PageHeader, Card } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function ProfileSubscriptionPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <PageHeader title={t('profile', 'navSubscription')} subtitle={t('profile', 'navSubscriptionDesc')} />
      <Card variant="elevated" padding="lg" className="rounded-2xl">
        <p className="text-gray-500 dark:text-gray-400">Gestion de l’abonnement à venir.</p>
      </Card>
    </div>
  );
}
