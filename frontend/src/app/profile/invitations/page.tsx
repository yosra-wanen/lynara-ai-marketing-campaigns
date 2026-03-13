'use client';

import { PageHeader, Card } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function ProfileInvitationsPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <PageHeader title={t('profile', 'navInvitations')} subtitle={t('profile', 'navInvitationsDesc')} />
      <Card variant="elevated" padding="lg" className="rounded-2xl">
        <p className="text-gray-500 dark:text-gray-400">Invitations reçues et envoyées à venir.</p>
      </Card>
    </div>
  );
}
