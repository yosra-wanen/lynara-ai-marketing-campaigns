/**
 * i18n - Internationalisation Lynara Campaign
 * Fichier de configuration et utilitaires de traduction
 */

export const locales = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

/** Clés de traduction par namespace (page) */
export type TranslationNamespace =
  | 'common'
  | 'home'
  | 'dashboard'
  | 'clients'
  | 'contacts'
  | 'sidebar'
  | 'header'
  | 'proposals'
  | 'contracts'
  | 'forms'
  | 'scheduling'
  | 'services'
  | 'reports'
  | 'automations'
  | 'settings'
  | 'accounting'
  | 'landing'
  | 'auth'
  | 'profile';

/** Structure des traductions - à étendre selon les namespaces */
export interface Translations {
  common: Record<string, string>;
  home: Record<string, string>;
  dashboard: Record<string, string>;
  clients: Record<string, string>;
  contacts: Record<string, string>;
  sidebar: Record<string, string>;
  header: Record<string, string>;
  [key: string]: Record<string, string>;
}

/** Récupère les traductions pour une locale (depuis le module statique) */
export { translations } from './i18n/translations';
