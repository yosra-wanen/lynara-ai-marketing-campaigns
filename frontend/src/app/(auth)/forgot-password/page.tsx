'use client';

import Link from 'next/link';
import { Card, Button, Input } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
          {t('auth', 'forgotTitle')}
        </h1>
        <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'forgotSubtitle')}
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
          <Button className="w-full" size="lg">
            {t('auth', 'resetButton')}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 font-medium text-[#64748B] hover:text-[#1E293B] dark:text-[#94A3B8] dark:hover:text-[#F5F5F5]"
          >
            <ArrowLeft size={16} />
            {t('auth', 'signIn')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
