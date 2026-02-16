'use client';

import Link from 'next/link';
import { Button, Card } from '@/components';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { HeroFloatingCards } from '@/components/landing/HeroFloatingCards';
import { CTAWithGlowRings } from '@/components/landing/CTAWithGlowRings';
import { useTranslation } from '@/providers/I18nProvider';
import { Sparkles, BarChart3, MessageCircle, Mail, Camera, Share2, Video, Settings } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-page dark:bg-gradient-page-dark flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] dark:border-[#3A3A3A] bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-logo text-white font-bold">
              L
            </div>
            <span className="text-lg font-bold text-[#1E293B] dark:text-[#F5F5F5]">
              Lynara
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm">{t('landing', 'login')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - badge, titre, diagramme, sous-titre + CTA */}
        <section className="container mx-auto px-4 py-16 text-center md:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl">
            <AnimateOnScroll className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-transparent bg-gradient-button-colored px-3 py-1.5 text-sm font-medium text-white shadow-sm">
                <Sparkles size={14} className="mr-2 opacity-90" />
                AI Powered Marketing
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-[#1E293B] via-[#334155] to-[#1E293B] dark:from-[#F5F5F5] dark:via-[#E2E8F0] dark:to-[#F5F5F5] bg-clip-text text-transparent pb-2">
                {t('landing', 'heroTitle')}
              </h1>
            </AnimateOnScroll>
            <AnimateOnScroll className="my-12 md:my-16">
              <HeroFloatingCards />
            </AnimateOnScroll>
            <AnimateOnScroll className="space-y-8">
              <p className="mx-auto max-w-[700px] text-lg text-[#64748B] dark:text-[#94A3B8] md:text-xl">
                {t('landing', 'heroSubtitle')}
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
                <CTAWithGlowRings>
                  <Link href="/register">
                    <Button variant="primary" size="lg" className="relative z-10 h-12 px-8 text-lg">
                      {t('landing', 'ctaPrimary')}
                    </Button>
                  </Link>
                </CTAWithGlowRings>
                <Link href="/demo">
                  <Button variant="secondary" size="lg" className="h-12 px-8 text-lg">
                    {t('landing', 'ctaSecondary')}
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <AnimateOnScroll className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
              {t('landing', 'featuresTitle')}
            </h2>
          </AnimateOnScroll>
          <div className="grid gap-8 md:grid-cols-3">
            <AnimateOnScroll delay={1}>
              <Card variant="elevated" padding="lg" className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 h-full">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#A079FF]/25 via-[#B394FF]/20 to-transparent opacity-60 blur-xl group-hover:opacity-100 transition-opacity" />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-button-colored text-white shadow-sm">
                <Sparkles size={24} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
                {t('landing', 'feature1Title')}
              </h3>
              <p className="text-[#64748B] dark:text-[#94A3B8]">
                {t('landing', 'feature1Desc')}
              </p>
            </Card>
            </AnimateOnScroll>

            <AnimateOnScroll delay={2}>
              <Card variant="elevated" padding="lg" className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 h-full">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-transparent opacity-50 blur-xl group-hover:opacity-100 transition-opacity" />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <MessageCircle size={24} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
                {t('landing', 'feature2Title')}
              </h3>
              <p className="text-[#64748B] dark:text-[#94A3B8]">
                {t('landing', 'feature2Desc')}
              </p>
            </Card>
            </AnimateOnScroll>

            <AnimateOnScroll delay={3}>
              <Card variant="elevated" padding="lg" className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 h-full">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-transparent opacity-50 blur-xl group-hover:opacity-100 transition-opacity" />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF] dark:text-[#B394FF]">
                <BarChart3 size={24} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
                {t('landing', 'feature3Title')}
              </h3>
              <p className="text-[#64748B] dark:text-[#94A3B8]">
                {t('landing', 'feature3Desc')}
              </p>
            </Card>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Channels Section - same design as capture: two gears icon + arc of slightly rotated cards */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <AnimateOnScroll className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-1 text-[#B5C94A] dark:text-[#DCE875] mb-4">
              <Settings size={20} className="rotate-[-12deg]" aria-hidden />
              <Settings size={20} className="rotate-[8deg] -ml-1" aria-hidden />
            </div>
            <h2 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
              {t('landing', 'channelsTitle')}
            </h2>
            <p className="mx-auto mt-4 max-w-[600px] text-[#64748B] dark:text-[#94A3B8]">
              {t('landing', 'channelsSubtitle')}
            </p>
          </AnimateOnScroll>
          <div className="flex flex-wrap justify-center items-end gap-4 md:gap-6">
            {[
              { icon: Mail, label: 'Email', color: 'bg-[#EA4335]/10 text-[#EA4335]', rotate: '-rotate-6' },
              { icon: MessageCircle, label: 'WhatsApp', color: 'bg-[#25D366]/10 text-[#25D366]', rotate: 'rotate-2' },
              { icon: Camera, label: 'Instagram', color: 'bg-[#E1306C]/10 text-[#E1306C]', rotate: '' },
              { icon: Share2, label: 'Facebook', color: 'bg-[#1877F2]/10 text-[#1877F2]', rotate: 'rotate-3' },
              { icon: Video, label: 'TikTok', color: 'bg-[#000000]/10 text-[#1E293B] dark:bg-[#F5F5F5]/10 dark:text-[#F5F5F5]', rotate: '-rotate-5' },
            ].map(({ icon: Icon, label, color, rotate }, i) => (
              <AnimateOnScroll key={label} delay={(i + 1) as 1 | 2 | 3 | 4 | 5}>
                <div
                  className={`flex flex-col items-center rounded-2xl border border-[#E2E8F0] dark:border-[#3A3A3A] bg-gray-50/80 dark:bg-[#252525] p-5 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${rotate}`}
                  style={{ marginTop: i === 2 ? 0 : i % 2 === 0 ? 12 : 6 }}
                >
                  <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-sm font-semibold text-[#1E293B] dark:text-[#F5F5F5]">{label}</span>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-[#3A3A3A] bg-white dark:bg-[#1A1A1A] py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          <p>{t('landing', 'footerRights')}</p>
        </div>
      </footer>
    </div>
  );
}
