'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components';
import { Building2, MapPin } from 'lucide-react';
import Select from 'react-select';
import { Country, State } from 'country-state-city';
import { countries } from 'countries-list';
import { TranslationService } from '@/app/services/translation.service';
import { ToastService } from '@/app/services/toast.service';
import { InputValidationService } from '@/app/services/input-validation.service';
import {
  CreateEnterpriseStepOneData,
  CreateEnterpriseStepTwoData,
  CreateEnterpriseStepOneErrors,
  CreateEnterpriseStepTwoErrors,
  emptyCreateEnterpriseStepOneErrors,
  emptyCreateEnterpriseStepTwoErrors,
} from '@/app/models/company.request.model';

// --- Currency ---
function getCurrencyForCountry(isoCode: string): string {
  const data = countries[isoCode as keyof typeof countries];
  if (!data?.currency) return '';
  const raw = Array.isArray(data.currency)
    ? data.currency[0] ?? ''
    : String(data.currency).split(',')[0].trim();
  return raw;
}

const countryOptions = Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name }));

export default function CreateEnterprisePage() {
  const router = useRouter();
  const translator = new TranslationService();
  const toastService = new ToastService();
  const validator = new InputValidationService();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [step2Submitted, setStep2Submitted] = useState(false);

  const [step1, setStep1] = useState<CreateEnterpriseStepOneData>({
    legal_name: '', capital_social: '', director_name: '',
    start_date: '', industry: '', activity_description: '',
  });

  const [step2, setStep2] = useState<CreateEnterpriseStepTwoData>({
    email: '', phone: '', country: 'TN',
    currency: getCurrencyForCountry('TN'), phone_prefix: '+216',
    street: '', city: '', state: '', state_code: '', postal_code: '',
  });

  const [step1Errors, setStep1Errors] = useState<CreateEnterpriseStepOneErrors>(emptyCreateEnterpriseStepOneErrors);
  const [step2Errors, setStep2Errors] = useState<CreateEnterpriseStepTwoErrors>(emptyCreateEnterpriseStepTwoErrors);

  // --- State options ---
  const stateOptions = step2.country
    ? State.getStatesOfCountry(step2.country)?.map((s) => ({
      value: s.isoCode,
      label: s.name
        .replace(/\s*Governorate$/i, '').replace(/\s*Province$/i, '')
        .replace(/\s*Region$/i, '').replace(/\s*District$/i, '').trim(),
    })) ?? []
    : [];

  // --- Validate step 1 ---
  function validateStep1(): boolean {
    const errors: CreateEnterpriseStepOneErrors = {
      legal_name: validator.validateField('legal_name', step1.legal_name),
      director_name: validator.validateField('director_name', step1.director_name),
      industry: validator.validateField('industry', step1.industry),
      capital_social: validator.validateField('capital_social', step1.capital_social),
    };
    setStep1Errors(errors);
    return !validator.hasErrors(errors);
  }

  // --- Validate step 2 ---
  function validateStep2(): boolean {
    const errors: CreateEnterpriseStepTwoErrors = {
      email: validator.validateField('email', step2.email),
      phone: validator.validateField('phone', step2.phone),
      postal_code: validator.validateField('postal_code', step2.postal_code),
      street: validator.validateField('street', step2.street),
      country: validator.validateField('country', step2.country),
      city: validator.validateField('city', step2.city),
      state: stateOptions.length > 0 && !step2.state_code
        ? validator.validateField('state', '') : '',
    };
    setStep2Errors(errors);
    return !validator.hasErrors(errors);
  }

  function handleNextStep() {
    setStep1Submitted(true);
    if (validateStep1()) setStep(2);
  }

  function handleCountryChange(option: { value: string; label: string } | null) {
    const code = option?.value ?? '';
    const countryData = Country.getCountryByCode(code);
    setStep2((prev) => ({
      ...prev,
      country: code,
      state: '',
      state_code: '',
      city: '',
      phone_prefix: countryData?.phonecode ? `+${countryData.phonecode}` : '',
      currency: getCurrencyForCountry(code),
    }));
    if (step2Submitted)
      setStep2Errors((prev) => ({ ...prev, country: validator.validateField('country', code) }));
  }

  const handleCreate = () => {
    setStep2Submitted(true);
    if (!validateStep2()) return;
    setLoading(true);

    const countryName = Country.getCountryByCode(step2.country)?.name ?? step2.country;
    const stateName = step2.state_code
      ? State.getStatesOfCountry(step2.country)?.find((s) => s.isoCode === step2.state_code)?.name ?? step2.state
      : step2.state;

    const body = {
      legal_name: step1.legal_name,
      capital_social: step1.capital_social ? parseFloat(step1.capital_social) : null,
      director_name: step1.director_name || null,
      start_date: step1.start_date || null,
      industry: step1.industry || null,
      activity_description: step1.activity_description || null,
      email: step2.email || null,
      phone: step2.phone_prefix && step2.phone
        ? `${step2.phone_prefix} ${step2.phone}`
        : step2.phone || null,
      country: countryName,
      currency: step2.currency || null,
      address: step2.street ? {
        line1: step2.street,
        city: step2.city || null,
        state: stateName || null,
        postal_code: step2.postal_code || null,
        country: countryName,
      } : null,
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw data.detail; return data; })
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
            {step === 1 ? translator.translate('auth', 'step1Subtitle') : translator.translate('auth', 'step2Subtitle')}
          </p>
        </div>

        <div className="flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-[#7C4DFF]" />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-[#7C4DFF]' : 'bg-gray-200 dark:bg-[#262626]'}`} />
        </div>

        <Card variant="elevated" padding="lg" className="space-y-6">

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={20} className="text-[#7C4DFF]" />
                <h2 className="font-semibold text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'step1Title')}</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'legalName')} <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Ex: SARL Innovation Tech"
                  value={step1.legal_name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStep1((prev) => ({ ...prev, legal_name: val }));
                    if (step1Submitted)
                      setStep1Errors((prev) => ({ ...prev, legal_name: validator.validateField('legal_name', val) }));
                  }}
                />
                {step1Submitted && step1Errors.legal_name && <p className="text-red-500 text-sm">{step1Errors.legal_name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'capitalSocial')} <span className="text-red-500">*</span></label>
                  <Input
                    type="text" placeholder="Ex: 10000" value={step1.capital_social}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStep1((prev) => ({ ...prev, capital_social: val }));
                      if (step1Submitted)
                        setStep1Errors((prev) => ({ ...prev, capital_social: validator.validateField('capital_social', val) }));
                    }}
                  />
                  {step1Submitted && step1Errors.capital_social && <p className="text-red-500 text-sm">{step1Errors.capital_social}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'directorName')} <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="Ex: Mohamed Ben Ali" value={step1.director_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStep1((prev) => ({ ...prev, director_name: val }));
                      if (step1Submitted)
                        setStep1Errors((prev) => ({ ...prev, director_name: validator.validateField('director_name', val) }));
                    }}
                  />
                  {step1Submitted && step1Errors.director_name && <p className="text-red-500 text-sm">{step1Errors.director_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'industry')} <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="Ex: Tech, Retail..." value={step1.industry}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStep1((prev) => ({ ...prev, industry: val }));
                      if (step1Submitted)
                        setStep1Errors((prev) => ({ ...prev, industry: validator.validateField('industry', val) }));
                    }}
                  />
                  {step1Submitted && step1Errors.industry && <p className="text-red-500 text-sm">{step1Errors.industry}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'startDate')} <span className="text-red-500">*</span></label>
                  <Input type="date" value={step1.start_date} onChange={(e) => setStep1((prev) => ({ ...prev, start_date: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'activityDescription')}</label>
                <textarea
                  rows={3} placeholder="Ex: Développement de logiciels..." value={step1.activity_description}
                  onChange={(e) => setStep1((prev) => ({ ...prev, activity_description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#1E293B] dark:text-[#F5F5F5] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none"
                />
              </div>

              <Button className="w-full" size="lg" onClick={handleNextStep}>
                {translator.translate('auth', 'next')}
              </Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={20} className="text-[#7C4DFF]" />
                <h2 className="font-semibold text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'step2Title')}</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'street')} <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Ex: 123 Avenue Habib Bourguiba" value={step2.street}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStep2((prev) => ({ ...prev, street: val }));
                    if (step2Submitted)
                      setStep2Errors((prev) => ({ ...prev, street: validator.validateField('street', val) }));
                  }}
                />
                {step2Submitted && step2Errors.street && <p className="text-red-500 text-sm">{step2Errors.street}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'country')} <span className="text-red-500">*</span></label>
                <Select
                  options={countryOptions}
                  value={step2.country ? { value: step2.country, label: Country.getCountryByCode(step2.country)?.name ?? step2.country } : null}
                  onChange={handleCountryChange}
                  placeholder="Sélectionner un pays..."
                  noOptionsMessage={() => 'Aucun résultat'}
                  isSearchable
                />
                {step2Submitted && step2Errors.country && <p className="text-red-500 text-sm">{step2Errors.country}</p>}
              </div>

              {stateOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'governorate')} <span className="text-red-500">*</span></label>
                  <Select
                    options={stateOptions}
                    value={stateOptions.find((o) => o.value === step2.state_code) ?? null}
                    onChange={(option) => {
                      const code = option?.value ?? '';
                      setStep2((prev) => ({ ...prev, state: option?.label ?? '', state_code: code, city: '' }));
                      if (step2Submitted)
                        setStep2Errors((prev) => ({ ...prev, state: validator.validateField('state', code) }));
                    }}
                    placeholder="Sélectionner un gouvernorat..."
                    noOptionsMessage={() => 'Aucun résultat'}
                    isSearchable
                    isClearable
                  />
                  {step2Submitted && step2Errors.state && <p className="text-red-500 text-sm">{step2Errors.state}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'city')} <span className="text-red-500">*</span></label>
                  <Input
                    value={step2.city}
                    placeholder="Ex: Tunis"
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '');
                      setStep2((prev) => ({ ...prev, city: val }));
                      if (step2Submitted)
                        setStep2Errors((prev) => ({ ...prev, city: validator.validateField('city', val) }));
                    }}
                  />
                  {step2Submitted && step2Errors.city && <p className="text-red-500 text-sm">{step2Errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'postalCode')}</label>
                  <Input
                    placeholder="Ex: 1000" value={step2.postal_code} inputMode="numeric"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setStep2((prev) => ({ ...prev, postal_code: val }));
                      if (step2Submitted)
                        setStep2Errors((prev) => ({ ...prev, postal_code: validator.validateField('postal_code', val) }));
                    }}
                  />
                  {step2Submitted && step2Errors.postal_code && <p className="text-red-500 text-sm">{step2Errors.postal_code}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'currency')}</label>
                <Input
                  value={step2.currency}
                  placeholder="TND"
                  readOnly
                  className="bg-gray-50 dark:bg-[#1a1a1a] cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-gray-400">Mis à jour automatiquement selon le pays</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'emailLabel')} <span className="text-red-500">*</span></label>
                  <Input
                    type="text" placeholder="contact@entreprise.tn" value={step2.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStep2((prev) => ({ ...prev, email: val }));
                      if (step2Submitted)
                        setStep2Errors((prev) => ({ ...prev, email: validator.validateField('email', val) }));
                    }}
                  />
                  {step2Submitted && step2Errors.email && <p className="text-red-500 text-sm">{step2Errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{translator.translate('auth', 'phoneLabel')} <span className="text-red-500">*</span></label>
                  <div className="flex rounded-lg border border-gray-200 dark:border-[#262626] overflow-hidden">
                    <div className="flex items-center px-3 bg-gray-100 dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-[#262626] shrink-0">
                      <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[42px]">{step2.phone_prefix || '+??'}</span>
                    </div>
                    <input
                      type="tel" value={step2.phone} placeholder="XX XXX XXX"
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#121212] text-[#1E293B] dark:text-[#F5F5F5] outline-none"
                      onChange={(e) => {
                        const val = e.target.value;
                        setStep2((prev) => ({ ...prev, phone: val }));
                        if (step2Submitted)
                          setStep2Errors((prev) => ({ ...prev, phone: validator.validateField('phone', val) }));
                      }}
                    />
                  </div>
                  {step2Submitted && step2Errors.phone && <p className="text-red-500 text-sm">{step2Errors.phone}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>
                  {translator.translate('auth', 'previous')}
                </Button>
                <Button className="flex-1" size="lg" onClick={handleCreate} disabled={loading}>
                  {loading ? translator.translate('auth', 'creating') : translator.translate('auth', 'createButton')}
                </Button>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}