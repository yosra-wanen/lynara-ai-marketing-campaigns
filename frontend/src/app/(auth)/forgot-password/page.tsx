'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Input } from '@/components';
import { ArrowLeft } from 'lucide-react';
import { ToastService } from '@/app/services/toast.service';
import { TranslationService } from '@/app/services/translation.service';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const toastService = new ToastService();
  const translator = new TranslationService();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        toastService.displayToast(responseData.message || translator.translate('auth', 'requestError'), 'error');
        return;
      }
      else {
        toastService.displayToast(translator.translate('auth', 'forgotSuccess'), 'success');
      }


    } catch (error) {
      toastService.displayToast(translator.translate('auth', 'serverError'), 'error');
    } finally {
      setLoading(false);
    }

  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
          {translator.translate('auth', 'forgotTitle')}
        </h1>
        <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
          {translator.translate('auth', 'forgotSubtitle')}
        </p>
      </div>

      <Card variant="elevated" padding="lg" className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {translator.translate('auth', 'emailLabel')}
            </label>
            <Input type="email" placeholder="name@company.com" name="email" required />
          </div>
          <Button className="w-full" size="lg" disabled={loading}>
            { translator.translate('auth',loading?'forgotSending':'forgotButton')}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 font-medium text-[#64748B] hover:text-[#1E293B] dark:text-[#94A3B8] dark:hover:text-[#F5F5F5]"
          >
            <ArrowLeft size={16} />
            {translator.translate('auth', 'signIn')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
