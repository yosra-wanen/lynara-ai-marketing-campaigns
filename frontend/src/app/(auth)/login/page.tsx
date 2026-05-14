'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components';
import { ToastService } from '@/app/services/toast.service';
import { TranslationService } from '@/app/services/translation.service';
import { supabase } from '@/lib/supabase';
import { Sparkles, BarChart2, Users, Zap, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: <BarChart2 size={18} />, text: 'Tableau de bord analytics en temps réel' },
  { icon: <Sparkles size={18} />, text: 'Génération de contenu IA pour Instagram' },
  { icon: <Users size={18} />, text: 'Gestion de leads et segmentation CRM' },
  { icon: <Zap size={18} />, text: 'Planification et publication automatisée' },
];

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
      }
      if (responseData.access_token && responseData.refresh_token) {
        await supabase.auth.setSession({
          access_token: responseData.access_token,
          refresh_token: responseData.refresh_token,
        });
      }
      router.push('/profile');
    } catch {
      toastService.displayToast(translator.translate('auth', 'serverError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #3B1FA3 0%, #6D3FEB 35%, #A079FF 70%, #C4A8FF 100%)' }}>

        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full opacity-10 -translate-y-1/2"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Lynara AI</span>
          </div>
        </div>

        {/* Tagline + features */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Boostez votre<br />
              présence digitale
            </h1>
            <p className="text-white/75 text-lg leading-relaxed max-w-sm">
              La plateforme IA tout-en-un pour gérer vos campagnes marketing et automatiser votre croissance.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white shrink-0">
                  {f.icon}
                </div>
                <span className="text-white/90 text-sm font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur">
            <div className="flex -space-x-1.5">
              {['#A079FF','#7C4DFF','#6D3FEB'].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white/30" style={{ background: c }} />
              ))}
            </div>
            <span className="text-white/80 text-xs font-medium">Rejoint par +500 entreprises</span>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-[#0a0a0a]">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6D3FEB, #A079FF)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Lynara AI</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {translator.translate('auth', 'loginTitle')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {translator.translate('auth', 'loginSubtitle')}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {translator.translate('auth', 'emailLabel')}
              </label>
              <Input type="email" placeholder="nom@entreprise.com" name="email" required />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {translator.translate('auth', 'passwordLabel')}
                </label>
                <Link href="/forgot-password"
                  className="text-xs font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] hover:underline transition-colors">
                  {translator.translate('auth', 'forgotLink')}
                </Link>
              </div>
              <Input type="password" name="password" required />
            </div>

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
              {translator.translate('auth', loading ? 'loggingIn' : 'loginButton')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {translator.translate('auth', 'noAccount')}{' '}
            <Link href="/register"
              className="font-semibold text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] hover:underline transition-colors">
              {translator.translate('auth', 'signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
