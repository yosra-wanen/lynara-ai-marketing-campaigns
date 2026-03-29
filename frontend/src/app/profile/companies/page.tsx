'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { Country, State } from 'country-state-city';
import { countries } from 'countries-list';
import { Input, Button, Avatar, Badge } from '@/components';
import { Search, Plus, Eye, MoreVertical, LogIn, Pencil, Trash2, X, Building2, Phone, MapPin, Upload, Bot } from 'lucide-react';
import { TranslationService } from '@/app/services/translation.service';
import { ToastService } from '@/app/services/toast.service';
import { InputValidationService } from '@/app/services/input-validation.service';
import {
  Company,
  CompanyUpdateForm,
  CompanyFormErrors,
  emptyCompanyFormErrors,
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

const VALIDATED_FIELDS: (keyof CompanyFormErrors)[] = [
  'legal_name', 'capital_social', 'director_name', 'industry',
  'currency', 'email', 'phone', 'street', 'city', 'country', 'postal_code',
];

const selectFocusStyles = {
  control: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    borderColor: state.isFocused ? '#7C4DFF' : undefined,
    boxShadow: state.isFocused ? '0 0 0 2px #7C4DFF33' : undefined,
    '&:hover': { borderColor: '#7C4DFF' },
  }),
};

export default function ProfileCompaniesPage() {
  const translator = new TranslationService();
  const toastService = new ToastService();
  const validator = new InputValidationService();
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<CompanyFormErrors>(emptyCompanyFormErrors);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CompanyUpdateForm>({
    legal_name: '', capital_social: '', director_name: '', start_date: '',
    industry: '', currency: '', activity_description: '', email: '',
    phone_prefix: '', phone: '', street: '', city: '', state: '',
    state_code: '', postal_code: '', country: '',
  });

  // --- Permission helpers ---
  const canEdit = (role: string) => role === 'owner' || role === 'admin';
  const canDelete = (role: string) => role === 'owner';

  // --- Close dropdown on outside click ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- State options ---
  const stateOptions = form.country
    ? State.getStatesOfCountry(form.country)?.map((s) => ({
      value: s.isoCode,
      label: s.name
        .replace(/\s*Governorate$/i, '').replace(/\s*Province$/i, '')
        .replace(/\s*Region$/i, '').replace(/\s*District$/i, '').trim(),
    })) ?? []
    : [];
  
  // --- Fetch ---
  const fetchCompanies = () => {
    if (companies.length === 0) setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/`, { method: 'GET', credentials: 'include' })
      .then(async (res) => { const body = await res.json(); if (!res.ok) throw body.detail; return body; })
      .then((response) => setCompanies(response.data || []))
      .catch(() => toastService.displayToast(translator.translate('profile', 'fetchError'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompanies(); }, []);

  const filtered = companies.filter((c) =>
    c.legal_name.toLowerCase().includes(search.toLowerCase())
  );

  // --- Live field change ---
  function handleFieldChange(name: keyof CompanyFormErrors, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (isFormSubmitted)
      setFormErrors((prev) => ({ ...prev, [name]: validator.validateField(name, value) }));
  }

  // --- Validate all ---
  function validateAll(): boolean {
    const newErrors = { ...emptyCompanyFormErrors };
    VALIDATED_FIELDS.forEach((field) => {
      newErrors[field] = validator.validateField(field, form[field as keyof CompanyUpdateForm] as string);
    });
    if (stateOptions.length > 0 && !form.state_code)
      newErrors.state = validator.validateField('state', '');
    setFormErrors(newErrors);
    return !validator.hasErrors(newErrors);
  }

  // --- Edit modal ---
  const handleEdit = (company: Company) => {
    if (!canEdit(company.role)) return;
    setOpenDropdown(null);
    setSelected(company);
    setIsFormSubmitted(false);
    setFormErrors(emptyCompanyFormErrors);

    const address = company.addresses?.[0];
    const countryIso = Country.getAllCountries().find(
      (c) => c.name === company.country || c.isoCode === company.country
    )?.isoCode ?? company.country ?? '';
    const countryData = Country.getCountryByCode(countryIso);
    const stateIso = address?.state
      ? State.getStatesOfCountry(countryIso)?.find(
        (s) => s.name === address.state || s.isoCode === address.state
      )?.isoCode ?? ''
      : '';

    setForm({
      legal_name: company.legal_name || '',
      capital_social: company.capital_social?.toString() || '',
      director_name: company.director_name || '',
      start_date: company.start_date || '',
      industry: company.industry || '',
      currency: company.currency || getCurrencyForCountry(countryIso) || '',
      activity_description: company.activity_description || '',
      email: company.email || '',
      phone_prefix: countryData?.phonecode ? `+${countryData.phonecode}` : '',
      phone: company.phone?.replace(/^\+\d+\s?/, '') || '',
      street: address?.line1 || '',
      city: address?.city || '',
      state: address?.state || '',
      state_code: stateIso,
      postal_code: address?.postal_code || '',
      country: countryIso,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
    setIsFormSubmitted(false);
    setFormErrors(emptyCompanyFormErrors);
  };

  // --- Delete ---
  const handleDelete = (company: Company) => {
    if (!canDelete(company.role)) return;
    setOpenDropdown(null);
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
    document.body.classList.add('modal-open');
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCompanyToDelete(null);
    document.body.classList.remove('modal-open');
  };

  const confirmDelete = () => {
    if (!companyToDelete) return;
    setDeleting(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${companyToDelete.company_id}`, { method: 'DELETE', credentials: 'include' })
      .then(async (res) => { const body = await res.json(); if (!res.ok) throw body.detail; return body; })
      .then(() => {
        toastService.displayToast(translator.translate('profile', 'deleteSuccess'), 'success');
        closeDeleteModal();
        fetchCompanies();
      })
      .catch((error) => toastService.displayToast(error?.detail || translator.translate('profile', 'serverError'), 'error'))
      .finally(() => setDeleting(false));
  };

  // --- Upload logo ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${selected.company_id}/logo`, { method: 'POST', credentials: 'include', body: formData })
      .then(async (res) => { const body = await res.json(); if (!res.ok) throw body.detail; return body; })
      .then((response) => {
        setSelected((prev: Company | null) => prev ? { ...prev, logo_url: response.data.logo_url } : null);
        toastService.displayToast(translator.translate('profile', 'logoSuccess'), 'success');
        fetchCompanies();
      })
      .catch((error) => toastService.displayToast(error?.detail || translator.translate('profile', 'serverError'), 'error'))
      .finally(() => setUploading(false));
  };

  // --- Save edit ---
  const saveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsFormSubmitted(true);
    if (!validateAll() || !selected) return;

    setSaving(true);
    const countryName = Country.getCountryByCode(form.country)?.name ?? form.country;
    const stateName = form.state_code
      ? State.getStatesOfCountry(form.country)?.find((s) => s.isoCode === form.state_code)?.name ?? form.state
      : form.state;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${selected.company_id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legal_name: form.legal_name || null,
        capital_social: form.capital_social ? parseFloat(form.capital_social) : null,
        director_name: form.director_name || null,
        start_date: form.start_date || null,
        industry: form.industry || null,
        currency: form.currency || null,
        activity_description: form.activity_description || null,
        email: form.email || null,
        phone: form.phone_prefix && form.phone
          ? `${form.phone_prefix} ${form.phone}`
          : form.phone || null,
        country: countryName || null,
        address: form.street ? {
          line1: form.street,
          city: form.city || null,
          state: stateName || null,
          postal_code: form.postal_code || null,
          country: countryName,
        } : null,
      }),
    })
      .then(async (res) => { const body = await res.json(); if (!res.ok) throw body.detail; return body; })
      .then(() => {
        toastService.displayToast(translator.translate('profile', 'companyUpdateSuccess'), 'success');
        closeModal();
        fetchCompanies();
      })
      .catch((error) => toastService.displayToast(error?.detail || translator.translate('profile', 'serverError'), 'error'))
      .finally(() => setSaving(false));
  };

  // --- Render list ---
  const renderContent = () => {
    if (loading) return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner-border" role="status" style={{ color: '#7C4DFF' }} />
      </div>
    );

    if (filtered.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-500 dark:text-gray-400">{translator.translate('profile', 'noCompanies')}</p>
        <Link href="/create-enterprise">
          <Button variant="primary" leftIcon={<Plus size={18} />}>{translator.translate('profile', 'addCompany')}</Button>
        </Link>
      </div>
    );

    return (
      <ul className="space-y-5">
        {filtered.map((company) => {
          const editAllowed = canEdit(company.role);
          const deleteAllowed = canDelete(company.role);

          return (
            <li key={company.company_id} className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 p-6 rounded-2xl border border-gray-100 dark:border-[#262626] bg-gray-50/50 dark:bg-[#121212] hover:border-gray-200 dark:hover:border-[#333] transition-colors overflow-visible">
              <div className="flex items-center gap-5 min-w-0 flex-1">
                <Avatar
                  src={company.logo_url || undefined}
                  fallback={company.legal_name.slice(0, 2).toUpperCase()}
                  size="lg"
                  className="shrink-0 bg-[#E8E0FF] dark:bg-[#A079FF]/25 text-[#7C4DFF] dark:text-[#B394FF] font-bold"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-bold text-gray-900 dark:text-white truncate">{company.legal_name}</h2>
                    <Badge
                      variant={company.role === 'owner' ? 'warning' : 'default'}
                      className="shrink-0 text-xs"
                    >
                      {company.role === 'owner'
                        ? translator.translate('profile', 'owner')
                        : company.role === 'admin'
                          ? translator.translate('profile', 'admin')
                          : translator.translate('profile', 'member')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {company.industry || company.email || company.country}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <Button variant="outline" size="sm" leftIcon={<Eye size={16} />}>
                  {translator.translate('profile', 'viewDetails')}
                </Button>

                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="outline" size="sm" leftIcon={<MoreVertical size={16} />}
                    disabled={!editAllowed && !deleteAllowed}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === company.company_id ? null : company.company_id);
                    }}
                  >
                    {translator.translate('profile', 'actions')}
                  </Button>

                  {openDropdown === company.company_id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#262626] shadow-lg z-50 overflow-hidden">
                      {(() => {
                        const aiAllowed = canEdit(company.role);
                        return (
                          <button
                            className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${aiAllowed ? 'edit-allowed' : 'edit-disallowed'}`}
                            onClick={() => {
                              if (!aiAllowed) return;
                              setOpenDropdown(null);
                              router.push(`/config?company_id=${company.company_id}`);
                            }}
                            disabled={!aiAllowed}
                            title={!aiAllowed ? translator.translate('profile', 'noPermissionEdit') : undefined}
                          >
                            <Bot size={15} className={aiAllowed ? 'text-[#7C4DFF]' : 'text-gray-300 dark:text-gray-600'} />
                            Config AI
                          </button>
                        );
                      })()}

                      <button
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${editAllowed ? 'edit-allowed' : 'edit-disallowed'}`}
                        onClick={() => editAllowed && handleEdit(company)}
                        disabled={!editAllowed}
                        title={!editAllowed ? translator.translate('profile', 'noPermissionEdit') : undefined}
                      >
                        <Pencil size={15} className={editAllowed ? 'text-[#7C4DFF]' : 'text-gray-300 dark:text-gray-600'} />
                        {translator.translate('profile', 'edit')}
                      </button>

                      <button
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${deleteAllowed ? 'delete-allowed' : 'delete-disallowed'}`}
                        onClick={() => deleteAllowed && handleDelete(company)}
                        disabled={!deleteAllowed}
                        title={!deleteAllowed ? translator.translate('profile', 'noPermissionDelete') : undefined}
                      >
                        <Trash2 size={15} />
                        {translator.translate('profile', 'delete')}
                      </button>
                    </div>
                  )}
                </div>

                <Link href="/dashboard">
                  <Button variant="primary" size="sm" leftIcon={<LogIn size={16} />}>
                    {translator.translate('profile', 'openCompany')}
                  </Button>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  // --- Main render ---
  return (
    <div className="p-6 md:p-10 max-w-5xl">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6 mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translator.translate('profile', 'yourCompanies')} ({filtered.length})
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center w-full sm:w-auto">
          <div className="flex-1 sm:min-w-[260px] sm:max-w-sm">
            <Input
              placeholder={translator.translate('profile', 'searchCompanies')}
              leftIcon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/create-enterprise" className="shrink-0">
            <Button variant="primary" leftIcon={<Plus size={18} />} className="w-full sm:w-auto">
              {translator.translate('profile', 'addCompany')}
            </Button>
          </Link>
        </div>
      </div>

      {renderContent()}

      {/* Edit modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col shadow-xl">

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#262626]">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {translator.translate('profile', 'editCompany')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            <form className="overflow-y-auto px-6 py-4 space-y-6" onSubmit={saveEdit} noValidate>

              <div className="flex items-center gap-4">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleLogoUpload} />
                <Avatar
                  src={selected.logo_url || undefined}
                  fallback={selected.legal_name.slice(0, 2).toUpperCase()}
                  size="lg"
                  className="bg-[#E8E0FF] dark:bg-[#A079FF]/25 text-[#7C4DFF] dark:text-[#B394FF] font-bold"
                />
                <div>
                  <Button variant="outline" size="sm" leftIcon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? translator.translate('profile', 'uploading') : translator.translate('profile', 'uploadLogo')}
                  </Button>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{translator.translate('profile', 'logoHint')}</p>
                </div>
              </div>

              {/* General info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[#7C4DFF]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{translator.translate('profile', 'generalInfo')}</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'legalName')} <span className="text-red-500">*</span></label>
                  <Input value={form.legal_name} onChange={(e) => handleFieldChange('legal_name', e.target.value)} />
                  {isFormSubmitted && formErrors.legal_name && <p className="text-xs text-red-500">{formErrors.legal_name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'capitalSocial')} <span className="text-red-500">*</span></label>
                    <Input type="text" value={form.capital_social} onChange={(e) => handleFieldChange('capital_social', e.target.value)} />
                    {isFormSubmitted && formErrors.capital_social && <p className="text-xs text-red-500">{formErrors.capital_social}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'directorName')} <span className="text-red-500">*</span></label>
                    <Input value={form.director_name} onChange={(e) => handleFieldChange('director_name', e.target.value)} />
                    {isFormSubmitted && formErrors.director_name && <p className="text-xs text-red-500">{formErrors.director_name}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'industry')} <span className="text-red-500">*</span></label>
                    <Input value={form.industry} onChange={(e) => handleFieldChange('industry', e.target.value)} />
                    {isFormSubmitted && formErrors.industry && <p className="text-xs text-red-500">{formErrors.industry}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'startDate')}</label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'currency')} <span className="text-red-500">*</span></label>
                  <Input
                    value={form.currency}
                    placeholder="TND"
                    readOnly
                    className="bg-gray-50 dark:bg-[#1a1a1a] cursor-not-allowed opacity-70"
                  />                  {isFormSubmitted && formErrors.currency && <p className="text-xs text-red-500">{formErrors.currency}</p>}
                  <p className="text-xs text-gray-400">Mis à jour automatiquement selon le pays</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'activityDescription')}</label>
                  <textarea
                    rows={3}
                    value={form.activity_description}
                    onChange={(e) => setForm((prev) => ({ ...prev, activity_description: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#1E293B] dark:text-[#F5F5F5] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-[#7C4DFF]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{translator.translate('profile', 'contactInfo')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'emailLabel')} <span className="text-red-500">*</span></label>
                    <Input type="text" value={form.email} onChange={(e) => handleFieldChange('email', e.target.value)} />
                    {isFormSubmitted && formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'phoneLabel')} <span className="text-red-500">*</span></label>
                    <div className="flex rounded-lg border border-gray-200 dark:border-[#262626] overflow-hidden focus-within:ring-2 focus-within:ring-[#7C4DFF] focus-within:border-[#7C4DFF]">
                      <div className="flex items-center px-3 bg-gray-100 dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-[#262626] shrink-0">
                        <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[42px]">{form.phone_prefix || '+??'}</span>
                      </div>
                      <input
                        type="tel" value={form.phone} placeholder="XX XXX XXX"
                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#121212] text-[#1E293B] dark:text-[#F5F5F5] outline-none"
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                      />
                    </div>
                    {isFormSubmitted && formErrors.phone && <p className="text-xs text-red-500">{formErrors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#7C4DFF]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{translator.translate('profile', 'addressInfo')}</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'street')} <span className="text-red-500">*</span></label>
                  <Input value={form.street} onChange={(e) => handleFieldChange('street', e.target.value)} />
                  {isFormSubmitted && formErrors.street && <p className="text-xs text-red-500">{formErrors.street}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'country')} <span className="text-red-500">*</span></label>
                  <Select
                    options={countryOptions}
                    styles={selectFocusStyles}
                    value={form.country ? { value: form.country, label: Country.getCountryByCode(form.country)?.name ?? form.country } : null}
                    onChange={(option) => {
                      const code = option?.value ?? '';
                      const countryData = Country.getCountryByCode(code);
                      setForm((prev) => ({
                        ...prev,
                        country: code,
                        state: '',
                        state_code: '',
                        city: '',
                        phone_prefix: countryData?.phonecode ? `+${countryData.phonecode}` : '',
                        currency: getCurrencyForCountry(code),
                      }));
                      if (isFormSubmitted)
                        setFormErrors((prev) => ({ ...prev, country: validator.validateField('country', code) }));
                    }}
                    placeholder="Sélectionner un pays..."
                    noOptionsMessage={() => 'Aucun résultat'}
                    isSearchable
                  />
                  {isFormSubmitted && formErrors.country && <p className="text-xs text-red-500">{formErrors.country}</p>}
                </div>

                {stateOptions.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'governorate')} <span className="text-red-500">*</span></label>
                    <Select
                      options={stateOptions}
                      styles={selectFocusStyles}
                      value={stateOptions.find((o) => o.value === form.state_code) ?? null}
                      onChange={(option) => {
                        const code = option?.value ?? '';
                        setForm((prev) => ({ ...prev, state: option?.label ?? '', state_code: code, city: '' }));
                        if (isFormSubmitted)
                          setFormErrors((prev) => ({ ...prev, state: validator.validateField('state', code) }));
                      }}
                      placeholder="Sélectionner un gouvernorat..."
                      noOptionsMessage={() => 'Aucun résultat'}
                      isSearchable
                      isClearable
                    />
                    {isFormSubmitted && formErrors.state && <p className="text-xs text-red-500">{formErrors.state}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'city')} <span className="text-red-500">*</span></label>
                    <Input
                      value={form.city}
                      placeholder="Ex: Tunis"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '');
                        setForm((prev) => ({ ...prev, city: val }));
                        if (isFormSubmitted)
                          setFormErrors((prev) => ({ ...prev, city: validator.validateField('city', val) }));
                      }}
                    />
                    {isFormSubmitted && formErrors.city && <p className="text-xs text-red-500">{formErrors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">{translator.translate('auth', 'postalCode')}</label>
                    <Input
                      value={form.postal_code} inputMode="numeric" placeholder="1000"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setForm((prev) => ({ ...prev, postal_code: val }));
                        if (isFormSubmitted)
                          setFormErrors((prev) => ({ ...prev, postal_code: validator.validateField('postal_code', val) }));
                      }}
                    />
                    {isFormSubmitted && formErrors.postal_code && <p className="text-xs text-red-500">{formErrors.postal_code}</p>}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-[#262626] flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>{translator.translate('profile', 'cancel')}</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? translator.translate('profile', 'saving') : translator.translate('profile', 'saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModalOpen && companyToDelete && (
        <>
          <div className="modal-backdrop fade show" onClick={closeDeleteModal} />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">{translator.translate('profile', 'deleteCompany')}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>
                <div className="modal-body">
                  <p className="text-muted">
                    {translator.translate('profile', 'deleteConfirm')}{' '}
                    <span className="fw-semibold text-dark">{companyToDelete.legal_name}</span> ?
                  </p>
                  <p className="text-danger small mt-2">{translator.translate('profile', 'deleteWarning')}</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal}>
                    {translator.translate('profile', 'cancel')}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? translator.translate('profile', 'deleting') : translator.translate('profile', 'delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}