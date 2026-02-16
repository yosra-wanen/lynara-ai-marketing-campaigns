'use client';

import { Card, Button, Input } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function CreateEnterprisePage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-page dark:bg-gradient-page-dark p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
            {t('auth', 'createEnterpriseTitle')}
          </h1>
          <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
            {t('auth', 'createEnterpriseSubtitle')}
          </p>
        </div>

        <Card variant="elevated" padding="lg" className="space-y-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                {t('auth', 'companyName')}
              </label>
              <Input placeholder="Acme Inc." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                {t('auth', 'industry')}
              </label>
              <Input placeholder="Marketing, Tech, Retail..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                {t('auth', 'size')}
              </label>
              <Input placeholder="1-10, 11-50..." />
            </div>
            <Button className="w-full" size="lg">
              {t('auth', 'createButton')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
