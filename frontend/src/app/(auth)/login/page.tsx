'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input } from '@/components';
import { ToastService } from '@/app/services/toast.service';
import { TranslationService } from '@/app/services/translation.service';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const toastService = new ToastService();
  const translator = new TranslationService();


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include',
        }
      );
      const responseData = await response.json();
      if (!response.ok) {
        toastService.displayToast(responseData.message || translator.translate('auth', 'requestError'), 'error');
        return;
      } else {
        router.push('/profile');
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
          {translator.translate('auth', 'loginTitle')}
        </h1>
        <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
          {translator.translate('auth', 'loginSubtitle')}
        </p>
      </div>

      <Card variant="elevated" padding="lg" className="space-y-6">
        <form className="space-y-4" method="post" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {translator.translate('auth', 'emailLabel')}
            </label>
            <Input type="email" placeholder="name@company.com" name="email" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                {translator.translate('auth', 'passwordLabel')}
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
              >
                {translator.translate('auth', 'forgotLink')}
              </Link>
            </div>
            <Input type="password"
              name="password"
              required
            />
          </div>
          <Button className="w-full" size="lg" disabled={loading}>
            { translator.translate('auth',loading?'loggingIn':'loginButton')}
          </Button>
        </form>

        <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          {translator.translate('auth', 'noAccount')}{' '}
          <Link
            href="/register"
            className="font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
          >
            {translator.translate('auth', 'signUp')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
