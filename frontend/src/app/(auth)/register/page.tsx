'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input } from '@/components';
import { ToastService } from '@/app/services/toast.service';
import { InputValidationService } from '../service/input-validation.service';
import { TranslationService } from '@/app/services/translation.service';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const toastService = new ToastService();
  const validator = new InputValidationService();
  const translator = new TranslationService();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setIsFormSubmitted(true);

    event.preventDefault();


    const formData = new FormData(event.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
    };

    if (passwordError === '' && phoneError === '' && acceptTerms === true) {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          toastService.displayToast(responseData.message || translator.translate('auth', 'requestError'), 'error');
          return;
        }
        else {
          toastService.displayToast(translator.translate('auth', 'registrationSuccess'), 'success');
          router.push('/login');

        }


      } catch (error) {
        toastService.displayToast(translator.translate('auth', 'serverError'), 'error');
      } finally {
        setLoading(false);
      }
    }
  }

  async function onPasswordInputChange(e: React.FormEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value;
    setPasswordError(validator.isPasswordValid(value));
  }

  async function onPhoneInputChange(e: React.FormEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value;
    setPhoneError(validator.isPhoneNumberValid(value));
  }


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
          {translator.translate('auth', 'registerTitle')}
        </h1>
        <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
          {translator.translate('auth', 'registerSubtitle')}
        </p>
      </div>

      <Card variant="elevated" padding="lg" className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {translator.translate('auth', 'nameLabel')}
            </label>
            <Input
              placeholder="John Doe"
              name="full_name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {translator.translate('auth', 'emailLabel')}
            </label>
            <Input
              type="email"
              placeholder="name@company.com"
              name="email"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {translator.translate('auth', 'phoneLabel')}
            </label>
            <Input
              type="tel"
              placeholder="+216 XX XXX XXX"
              name="phone"
              onInput={(e) => onPhoneInputChange(e)}
            />
            {isFormSubmitted && phoneError && <p className="error text-red-500">{phoneError}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {translator.translate('auth', 'passwordLabel')}
            </label>
            <Input
              type="password"
              name="password"
              required
              onInput={(e) => onPasswordInputChange(e)}
            />
            {isFormSubmitted && passwordError && <p className="error text-red-500">{passwordError}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAcceptTerms(e.target.checked)}
              required
            />
            <label htmlFor="acceptTerms" className="text-sm text-[#1E293B] dark:text-[#F5F5F5]" dangerouslySetInnerHTML={{ __html: translator.translate('auth', 'termsLabel') }} />

          </div>

          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? 'Inscription en cours...' : translator.translate('auth', 'registerButton')}
          </Button>
        </form>

        <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          {translator.translate('auth', 'hasAccount')}{' '}
          <Link
            href="/login"
            className="font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
          >
            {translator.translate('auth', 'signIn')}
          </Link>
        </div>
      </Card>
    </div>
  );
}