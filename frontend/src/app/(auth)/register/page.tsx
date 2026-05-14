'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components';
import { ToastService } from '@/app/services/toast.service';
import { InputValidationService } from '../../services/input-validation.service';
import { TranslationService } from '@/app/services/translation.service';
import { Sparkles, UserCircle2, Lock, ArrowRight, Check } from 'lucide-react';

const STEPS = [
  { label: 'Identité', icon: <UserCircle2 size={14} /> },
  { label: 'Sécurité', icon: <Lock size={14} /> },
  { label: 'Confirmation', icon: <Check size={14} /> },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
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
            body: JSON.stringify(data),
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          toastService.displayToast(responseData.message || translator.translate('auth', 'requestError'), 'error');
          return;
        }
        setCurrentStep(2);
        toastService.displayToast(translator.translate('auth', 'registrationSuccess'), 'success');
        setTimeout(() => router.push('/login'), 1500);
      } catch {
        toastService.displayToast(translator.translate('auth', 'serverError'), 'error');
      } finally {
        setLoading(false);
      }
    }
  }

  function onPasswordInputChange(e: React.FormEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value;
    setPasswordError(validator.isPasswordValid(value));
    if (value.length > 0) setCurrentStep(Math.max(currentStep, 1));
  }

  function onPhoneInputChange(e: React.FormEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value;
    setPhoneError(validator.isPhoneNumberValid(value));
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #3B1FA3 0%, #6D3FEB 35%, #A079FF 70%, #C4A8FF 100%)' }}>

        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Lynara AI</span>
        </div>

        {/* Steps visual */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Créez votre<br />compte en 3 étapes
            </h1>
            <p className="text-white/75 text-lg">Rapide, sécurisé, gratuit.</p>
          </div>

          <div className="space-y-4 mt-6">
            {STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-4 transition-all duration-300 ${i <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                  i < currentStep ? 'bg-white text-[#7C4DFF]' :
                  i === currentStep ? 'bg-white/25 text-white ring-2 ring-white/50' :
                  'bg-white/10 text-white/60'
                }`}>
                  {i < currentStep ? <Check size={16} /> : step.icon}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${i <= currentStep ? 'text-white' : 'text-white/60'}`}>
                    Étape {i + 1} — {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur">
            <Sparkles size={14} className="text-white/80" />
            <span className="text-white/80 text-xs font-medium">100% gratuit · Sans carte bancaire</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-[#0a0a0a]">
        <div className="w-full max-w-md space-y-7">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6D3FEB, #A079FF)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Lynara AI</span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>Progression</span>
              <span>{Math.min(100, Math.round((currentStep / 2) * 100))}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((currentStep / 2) * 100))}%`,
                  background: 'linear-gradient(90deg, #6D3FEB, #A079FF)',
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {translator.translate('auth', 'registerTitle')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {translator.translate('auth', 'registerSubtitle')}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {translator.translate('auth', 'nameLabel')}
              </label>
              <Input
                placeholder="Jean Dupont"
                name="full_name"
                required
                onChange={() => setCurrentStep(Math.max(currentStep, 0))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {translator.translate('auth', 'emailLabel')}
              </label>
              <Input type="email" placeholder="nom@entreprise.com" name="email" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {translator.translate('auth', 'phoneLabel')}
              </label>
              <Input type="tel" placeholder="+216 XX XXX XXX" name="phone" onInput={onPhoneInputChange} />
              {isFormSubmitted && phoneError && (
                <p className="text-xs text-red-500">{phoneError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {translator.translate('auth', 'passwordLabel')}
              </label>
              <Input type="password" name="password" required onInput={onPasswordInputChange} />
              {isFormSubmitted && passwordError && (
                <p className="text-xs text-red-500">{passwordError}</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (e.target.checked) setCurrentStep(Math.max(currentStep, 2));
                  }}
                />
                <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                  acceptTerms
                    ? 'border-[#7C4DFF] bg-[#7C4DFF]'
                    : 'border-gray-300 dark:border-gray-600 group-hover:border-[#7C4DFF]'
                }`}>
                  {acceptTerms && <Check size={12} className="text-white" />}
                </div>
              </div>
              <span
                className="text-sm text-gray-600 dark:text-gray-400 leading-snug"
                dangerouslySetInnerHTML={{ __html: translator.translate('auth', 'termsLabel') }}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{ background: 'linear-gradient(120deg, #6D3FEB 0%, #7C4DFF 50%, #A079FF 100%)' }}
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <ArrowRight size={16} />}
              {loading ? 'Inscription en cours…' : translator.translate('auth', 'registerButton')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {translator.translate('auth', 'hasAccount')}{' '}
            <Link href="/login"
              className="font-semibold text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] hover:underline transition-colors">
              {translator.translate('auth', 'signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
