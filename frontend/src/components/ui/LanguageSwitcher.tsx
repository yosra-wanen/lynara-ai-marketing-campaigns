'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from '@/providers/I18nProvider';
import { locales, localeNames, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Changer de langue"
        aria-expanded={isOpen}
      >
        <Globe size={18} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-lg dark:border-[#3A3A3A] dark:bg-[#1E1E1E] z-50">
          <ul className="flex flex-col gap-1">
            {locales.map((l) => (
              <li key={l}>
                <button
                  onClick={() => handleLanguageChange(l)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                    locale === l
                      ? 'bg-[#E8E0FF] text-[#7C4DFF] font-medium dark:bg-[#A079FF]/20 dark:text-[#B394FF]'
                      : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-[#2A2A2A]'
                  )}
                >
                  <span>{localeNames[l]}</span>
                  {locale === l && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#A079FF]" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
