'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components';
import { Building2, MapPin } from 'lucide-react';
import { TranslationService } from '@/app/services/translation.service';
import { ToastService } from '@/app/services/toast.service';

type Step1Data = {
  legal_name:           string;
  capital_social:       string;
  director_name:        string;
  start_date:           string;
  industry:             string;
  activity_description: string;
};

type Step2Data = {
  email:       string;
  phone:       string;
  country:     string;
  currency:    string;
  street:      string;
  city:        string;
  state:       string;
  postal_code: string;
};

export default function CreateEnterprisePage() {
  const router       = useRouter();
  const translator   = new TranslationService();
  const toastService = new ToastService();

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  const [step1, setStep1] = useState<Step1Data>({
    legal_name:           '',
    capital_social:       '',
    director_name:        '',
    start_date:           '',
    industry:             '',
    activity_description: '',
  });

  const [step2, setStep2] = useState<Step2Data>({
    email:       '',
    phone:       '',
    country:     'TN',
    currency:    'TND',
    street:      '',
    city:        '',
    state:       '',
    postal_code: '',
  });

  const handleCreate = () => {
    setLoading(true);

    const body = {
      legal_name:           step1.legal_name,
      capital_social:       step1.capital_social ? parseFloat(step1.capital_social) : null,
      director_name:        step1.director_name        || null,
      start_date:           step1.start_date           || null,
      industry:             step1.industry             || null,
      activity_description: step1.activity_description || null,
      email:                step2.email                || null,
      phone:                step2.phone                || null,
      country:              step2.country,
      currency:             step2.currency,
      address: step2.street ? {
        line1:       step2.street,
        city:        step2.city        || null,
        state:       step2.state       || null,
        postal_code: step2.postal_code || null,
        country:     step2.country,
      } : null,
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(body),
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw data.detail;
      return data;
    })
    .then(() => {
      toastService.displayToast(translator.translate('auth', 'createSuccess'), 'success');
      router.push('/profile/companies');
    })
    .catch((error) => {
      toastService.displayToast(error?.detail || translator.translate('auth', 'serverError'), 'error');
    })
    .finally(() => setLoading(false));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-page dark:bg-gradient-page-dark p-4">
      <div className="w-full max-w-lg space-y-8">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
            {translator.translate('auth', 'createEnterpriseTitle')}
          </h1>
          <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
            {step === 1
              ? translator.translate('auth', 'step1Subtitle')
              : translator.translate('auth', 'step2Subtitle')
            }
          </p>
        </div>

        {/* Progress bar — 2 barres, la 2ème devient violette à l'étape 2 */}
        <div className="flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-[#7C4DFF]" />
          <div className={`h-1 flex-1 rounded-full transition-colors ${
            step === 2 ? 'bg-[#7C4DFF]' : 'bg-gray-200 dark:bg-[#262626]'
          }`} />
        </div>

        <Card variant="elevated" padding="lg" className="space-y-6">

          {/* ── Étape 1 — visible seulement si step === 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={20} className="text-[#7C4DFF]" />
                <h2 className="font-semibold text-[#1E293B] dark:text-[#F5F5F5]">
                  {translator.translate('auth', 'step1Title')}
                </h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                  {translator.translate('auth', 'legalName')} <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ex: SARL Innovation Tech"
                  value={step1.legal_name}
                  onChange={(e) => setStep1({ ...step1, legal_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'capitalSocial')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex: 10000"
                    value={step1.capital_social}
                    onChange={(e) => setStep1({ ...step1, capital_social: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'directorName')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Ex: Mohamed Ben Ali"
                    value={step1.director_name}
                    onChange={(e) => setStep1({ ...step1, director_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'industry')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Ex: Tech, Retail..."
                    value={step1.industry}
                    onChange={(e) => setStep1({ ...step1, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'startDate')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={step1.start_date}
                    onChange={(e) => setStep1({ ...step1, start_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                  {translator.translate('auth', 'activityDescription')}
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Développement de logiciels..."
                  value={step1.activity_description}
                  onChange={(e) => setStep1({ ...step1, activity_description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#1E293B] dark:text-[#F5F5F5] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep(2)}
                disabled={
                  !step1.legal_name     ||
                  !step1.capital_social ||
                  !step1.director_name  ||
                  !step1.industry       ||
                  !step1.start_date
                }
              >
                {translator.translate('auth', 'next')}
              </Button>
            </div>
          )}

          {/* ── Étape 2 — visible seulement si step === 2 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={20} className="text-[#7C4DFF]" />
                <h2 className="font-semibold text-[#1E293B] dark:text-[#F5F5F5]">
                  {translator.translate('auth', 'step2Title')}
                </h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                  {translator.translate('auth', 'street')} <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ex: 123 Avenue Habib Bourguiba"
                  value={step2.street}
                  onChange={(e) => setStep2({ ...step2, street: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'city')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Ex: Tunis"
                    value={step2.city}
                    onChange={(e) => setStep2({ ...step2, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'governorate')}
                  </label>
                  <Input
                    placeholder="Ex: Tunis"
                    value={step2.state}
                    onChange={(e) => setStep2({ ...step2, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'postalCode')}
                  </label>
                  <Input
                    placeholder="Ex: 1000"
                    value={step2.postal_code}
                    onChange={(e) => setStep2({ ...step2, postal_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'country')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Ex: TN"
                    value={step2.country}
                    onChange={(e) => setStep2({ ...step2, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'emailLabel')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="contact@entreprise.tn"
                    value={step2.email}
                    onChange={(e) => setStep2({ ...step2, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'phoneLabel')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="+216 20 123 456"
                    value={step2.phone}
                    onChange={(e) => setStep2({ ...step2, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>
                  {translator.translate('auth', 'previous')}
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleCreate}
                  disabled={
                    loading        ||
                    !step2.street  ||
                    !step2.city    ||
                    !step2.country ||
                    !step2.email   ||
                    !step2.phone
                  }
                >
                  {loading
                    ? translator.translate('auth', 'creating')
                    : translator.translate('auth', 'createButton')
                  }
                </Button>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}
