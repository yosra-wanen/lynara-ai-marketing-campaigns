'use client';

import Link from 'next/link';
import { Card, Button, Input } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
          {t('auth', 'registerTitle')}
        </h1>
        <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'registerSubtitle')}
        </p>
      </div>

      <Card variant="elevated" padding="lg" className="space-y-6">
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {t('auth', 'nameLabel')}
            </label>
            <Input placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {t('auth', 'emailLabel')}
            </label>
            <Input type="email" placeholder="name@company.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {t('auth', 'passwordLabel')}
            </label>
            <Input type="password" />
          </div>
          <Button className="w-full" size="lg">
            {t('auth', 'registerButton')}
          </Button>
        </form>

        <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'hasAccount')}{' '}
          <Link
            href="/login"
            className="font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
          >
            {t('auth', 'signIn')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
