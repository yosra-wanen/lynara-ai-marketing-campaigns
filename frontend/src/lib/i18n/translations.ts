import frCommon from "@/locales/fr/common.json";
import frHome from "@/locales/fr/home.json";
import frDashboard from "@/locales/fr/dashboard.json";
import frClients from "@/locales/fr/clients.json";
import frContacts from "@/locales/fr/contacts.json";
import frSidebar from "@/locales/fr/sidebar.json";
import frHeader from "@/locales/fr/header.json";
import frProposals from "@/locales/fr/proposals.json";
import frContracts from "@/locales/fr/contracts.json";
import frForms from "@/locales/fr/forms.json";
import frScheduling from "@/locales/fr/scheduling.json";
import frServices from "@/locales/fr/services.json";
import frReports from "@/locales/fr/reports.json";
import frAutomations from "@/locales/fr/automations.json";
import frSettings from "@/locales/fr/settings.json";
import frAccounting from "@/locales/fr/accounting.json";
import frLanding from "@/locales/fr/landing.json";
import frAuth from "@/locales/fr/auth.json";
import frProfile from "@/locales/fr/profile.json";

import enCommon from "@/locales/en/common.json";
import enHome from "@/locales/en/home.json";
import enDashboard from "@/locales/en/dashboard.json";
import enClients from "@/locales/en/clients.json";
import enContacts from "@/locales/en/contacts.json";
import enSidebar from "@/locales/en/sidebar.json";
import enHeader from "@/locales/en/header.json";
import enProposals from "@/locales/en/proposals.json";
import enContracts from "@/locales/en/contracts.json";
import enForms from "@/locales/en/forms.json";
import enScheduling from "@/locales/en/scheduling.json";
import enServices from "@/locales/en/services.json";
import enReports from "@/locales/en/reports.json";
import enAutomations from "@/locales/en/automations.json";
import enSettings from "@/locales/en/settings.json";
import enAccounting from "@/locales/en/accounting.json";
import enLanding from "@/locales/en/landing.json";
import enAuth from "@/locales/en/auth.json";
import enProfile from "@/locales/en/profile.json";

import type { Locale } from "../i18n";

export const translations: Record<
  Locale,
  Record<string, Record<string, string>>
> = {
  fr: {
    common: frCommon as Record<string, string>,
    home: frHome as Record<string, string>,
    dashboard: frDashboard as Record<string, string>,
    clients: frClients as Record<string, string>,
    contacts: frContacts as Record<string, string>,
    sidebar: frSidebar as Record<string, string>,
    header: frHeader as Record<string, string>,
    proposals: frProposals as Record<string, string>,
    contracts: frContracts as Record<string, string>,
    forms: frForms as Record<string, string>,
    scheduling: frScheduling as Record<string, string>,
    services: frServices as Record<string, string>,
    reports: frReports as Record<string, string>,
    automations: frAutomations as Record<string, string>,
    settings: frSettings as Record<string, string>,
    accounting: frAccounting as Record<string, string>,
    landing: frLanding as Record<string, string>,
    auth: frAuth as Record<string, string>,
    profile: frProfile as Record<string, string>,
  },
  en: {
    common: enCommon as Record<string, string>,
    home: enHome as Record<string, string>,
    dashboard: enDashboard as Record<string, string>,
    clients: enClients as Record<string, string>,
    contacts: enContacts as Record<string, string>,
    sidebar: enSidebar as Record<string, string>,
    header: enHeader as Record<string, string>,
    proposals: enProposals as Record<string, string>,
    contracts: enContracts as Record<string, string>,
    forms: enForms as Record<string, string>,
    scheduling: enScheduling as Record<string, string>,
    services: enServices as Record<string, string>,
    reports: enReports as Record<string, string>,
    automations: enAutomations as Record<string, string>,
    settings: enSettings as Record<string, string>,
    accounting: enAccounting as Record<string, string>,
    landing: enLanding as Record<string, string>,
    auth: enAuth as Record<string, string>,
    profile: enProfile as Record<string, string>,
  },
  ar: {
    common: frCommon as Record<string, string>,
    home: frHome as Record<string, string>,
    dashboard: frDashboard as Record<string, string>,
    clients: frClients as Record<string, string>,
    contacts: frContacts as Record<string, string>,
    sidebar: frSidebar as Record<string, string>,
    header: frHeader as Record<string, string>,
    proposals: frProposals as Record<string, string>,
    contracts: frContracts as Record<string, string>,
    forms: frForms as Record<string, string>,
    scheduling: frScheduling as Record<string, string>,
    services: frServices as Record<string, string>,
    reports: frReports as Record<string, string>,
    automations: frAutomations as Record<string, string>,
    settings: frSettings as Record<string, string>,
    accounting: frAccounting as Record<string, string>,
    landing: frLanding as Record<string, string>,
    auth: frAuth as Record<string, string>,
    profile: frProfile as Record<string, string>,
  },
};
