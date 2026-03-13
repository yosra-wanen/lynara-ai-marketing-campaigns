'use client';

import Link from 'next/link';
import { Card, Button, Input } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
          {t('auth', 'loginTitle')}
        </h1>
        <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'loginSubtitle')}
        </p>
      </div>

      <Card variant="elevated" padding="lg" className="space-y-6">
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {t('auth', 'emailLabel')}
            </label>
            <Input type="email" placeholder="name@company.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                {t('auth', 'passwordLabel')}
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
              >
                {t('auth', 'forgotLink')}
              </Link>
            </div>
            <Input type="password" />
          </div>
          <Button className="w-full" size="lg">
            {t('auth', 'loginButton')}
          </Button>
        </form>

        <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'noAccount')}{' '}
          <Link
            href="/register"
            className="font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
          >
            {t('auth', 'signUp')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
