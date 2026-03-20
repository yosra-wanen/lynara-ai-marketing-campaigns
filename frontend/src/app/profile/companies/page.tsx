'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Input, Button, Avatar, Badge } from '@/components';
import { Search, Plus, Eye, MoreVertical, LogIn, Pencil, Trash2, X, Building2, Phone, MapPin, Upload } from 'lucide-react';
import { TranslationService } from '@/app/services/translation.service';
import { ToastService } from '@/app/services/toast.service';

type Address = {
  line1:       string;
  city:        string;
  state:       string | null;
  postal_code: string | null;
  country:     string;
};

type Company = {
  company_id:           string;
  legal_name:           string;
  industry:             string | null;
  email:                string | null;
  phone:                string | null;
  country:              string;
  currency:             string | null;
  logo_url:             string | null;
  role:                 string;
  status:               string;
  capital_social:       number | null;
  director_name:        string | null;
  start_date:           string | null;
  activity_description: string | null;
  addresses:            Address[] | null;
};

type UpdateForm = {
  legal_name:           string;
  capital_social:       string;
  director_name:        string;
  start_date:           string;
  industry:             string;
  currency:             string;
  activity_description: string;
  email:                string;
  phone:                string;
  street:               string;
  city:                 string;
  state:                string;
  postal_code:          string;
  country:              string;
};


export default function ProfileCompaniesPage() {
  const translator = new TranslationService();
  const toastService = new ToastService();

  const [companies, setCompanies]             = useState<Company[]>([]);
  const [search, setSearch]                   = useState('');
  const [loading, setLoading]                 = useState(true);
  const [openDropdown, setOpenDropdown]       = useState<string | null>(null);
  const [modalOpen, setModalOpen]             = useState(false);
  const [selected, setSelected]               = useState<Company | null>(null);
  const [saving, setSaving]                   = useState(false);
  const [uploading, setUploading]             = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UpdateForm>();

  const fetchCompanies = () => {
    if (companies.length === 0) setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/`, {
      method:      'GET',
      credentials: 'include',
    })
    .then(async res => {
      const body = await res.json();
      if (!res.ok) throw body.detail;
      return body;
    })
    .then((response) => {
      setCompanies(response.data || []);
    })
    .catch(() => {
      toastService.displayToast(translator.translate('profile', 'fetchError'), 'error');
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompanies(); }, []);

  const filtered = companies.filter((c) =>
    c.legal_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (company: Company) => {
    setOpenDropdown(null);
    setSelected(company);
    const address = company.addresses?.[0];
    setForm({
      legal_name:           company.legal_name                 || '',
      capital_social:       company.capital_social?.toString() || '',
      director_name:        company.director_name              || '',
      start_date:           company.start_date                 || '',
      industry:             company.industry                   || '',
      currency:             company.currency                   || '',
      activity_description: company.activity_description       || '',
      email:                company.email                      || '',
      phone:                company.phone                      || '',
      street:               address?.line1                     || '',
      city:                 address?.city                      || '',
      state:                address?.state                     || '',
      postal_code:          address?.postal_code               || '',
      country:              company.country                    || '',
    });
    setModalOpen(true);
  };

  const handleDelete = (company: Company) => {
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

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${companyToDelete.company_id}`, {
      method:      'DELETE',
      credentials: 'include',
    })
    .then(async res => {
      const body = await res.json();
      if (!res.ok) throw body.detail;
      return body;
    })
    .then(() => {
      toastService.displayToast(translator.translate('profile', 'deleteSuccess'), 'success');
      closeDeleteModal();
      fetchCompanies();
    })
    .catch((error) => {
      toastService.displayToast(error?.detail || translator.translate('profile', 'serverError'), 'error');
    })
    .finally(() => setDeleting(false));
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${selected.company_id}/logo`, {
      method:      'POST',
      credentials: 'include',
      body:        formData,
    })
    .then(async res => {
      const body = await res.json();
      if (!res.ok) throw body.detail;
      return body;
    })
    .then((response) => {
      setSelected(prev => prev ? { ...prev, logo_url: response.data.logo_url } : null);
      toastService.displayToast(translator.translate('profile', 'logoSuccess'), 'success');
      fetchCompanies();
    })
    .catch((error) => {
      toastService.displayToast(error?.detail || translator.translate('profile', 'serverError'), 'error');
    })
    .finally(() => setUploading(false));
  };

  const saveEdit = () => {
    if (!selected) return;
    setSaving(true);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${selected.company_id}`, {
      method:      'PUT',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legal_name:           form.legal_name           || null,
        capital_social:       form.capital_social ? parseFloat(form.capital_social) : null,
        director_name:        form.director_name        || null,
        start_date:           form.start_date           || null,
        industry:             form.industry             || null,
        currency:             form.currency             || null,
        activity_description: form.activity_description || null,
        email:                form.email                || null,
        phone:                form.phone                || null,
        country:              form.country              || null,
        address: form.street ? {
          line1:       form.street,
          city:        form.city        || null,
          state:       form.state       || null,
          postal_code: form.postal_code || null,
          country:     form.country,
        } : null,
      }),
    })
    .then(async res => {
      const body = await res.json();
      if (!res.ok) throw body.detail;
      return body;
    })
    .then(() => {
      toastService.displayToast(translator.translate('profile', 'companyUpdateSuccess'), 'success');
      closeModal();
      fetchCompanies();
    })
    .catch((error) => {
      toastService.displayToast(error?.detail || translator.translate('profile', 'serverError'), 'error');
    })
    .finally(() => setSaving(false));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="spinner-border" role="status" style={{ color: '#7C4DFF' }} />
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-gray-500 dark:text-gray-400">
            {translator.translate('profile', 'noCompanies')}
          </p>
          <Link href="/create-enterprise">
            <Button variant="primary" leftIcon={<Plus size={18} />}>
              {translator.translate('profile', 'addCompany')}
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <ul className="space-y-5">
        {filtered.map((company) => (
          <li
            key={company.company_id}
            className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 p-6 rounded-2xl border border-gray-100 dark:border-[#262626] bg-gray-50/50 dark:bg-[#121212] hover:border-gray-200 dark:hover:border-[#333] transition-colors overflow-visible"
          >
            <div className="flex items-center gap-5 min-w-0 flex-1">
              <Avatar
                src={company.logo_url || undefined}
                fallback={company.legal_name.slice(0, 2).toUpperCase()}
                size="lg"
                className="shrink-0 bg-[#E8E0FF] dark:bg-[#A079FF]/25 text-[#7C4DFF] dark:text-[#B394FF] font-bold"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-bold text-gray-900 dark:text-white truncate">
                    {company.legal_name}
                  </h2>
                  <Badge
                    variant={company.role === 'owner' ? 'warning' : 'default'}
                    className="shrink-0 text-xs"
                  >
                    {company.role === 'owner'
                      ? translator.translate('profile', 'owner')
                      : translator.translate('profile', 'admin')
                    }
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

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MoreVertical size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(
                      openDropdown === company.company_id ? null : company.company_id
                    );
                  }}
                >
                  {translator.translate('profile', 'actions')}
                </Button>

                {openDropdown === company.company_id && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#262626] shadow-lg z-50 overflow-hidden">
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors"
                      onClick={() => handleEdit(company)}
                    >
                      <Pencil size={15} className="text-[#7C4DFF]" />
                      {translator.translate('profile', 'edit')}
                    </button>
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      onClick={() => handleDelete(company)}
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
        ))}
      </ul>
    );
  };

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

      {/* ── Modal Modifier ── */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col shadow-xl">

            {/* Header fixe */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#262626]">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {translator.translate('profile', 'editCompany')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            {/* Body scrollable */}
            <div className="overflow-y-auto px-6 py-4 space-y-6">

              {/* ── Upload Logo ── */}
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Avatar
                  src={selected.logo_url || undefined}
                  fallback={selected.legal_name.slice(0, 2).toUpperCase()}
                  size="lg"
                  className="bg-[#E8E0FF] dark:bg-[#A079FF]/25 text-[#7C4DFF] dark:text-[#B394FF] font-bold"
                />
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload size={16} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading
                      ? translator.translate('profile', 'uploading')
                      : translator.translate('profile', 'uploadLogo')
                    }
                  </Button>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {translator.translate('profile', 'logoHint')}
                  </p>
                </div>
              </div>

              {/* ── Informations générales ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[#7C4DFF]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {translator.translate('profile', 'generalInfo')}
                  </h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    {translator.translate('auth', 'legalName')}
                  </label>
                  <Input
                    value={form.legal_name}
                    onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'capitalSocial')}
                    </label>
                    <Input
                      type="number"
                      value={form.capital_social}
                      onChange={(e) => setForm({ ...form, capital_social: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'directorName')}
                    </label>
                    <Input
                      value={form.director_name}
                      onChange={(e) => setForm({ ...form, director_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'industry')}
                    </label>
                    <Input
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'startDate')}
                    </label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    {translator.translate('auth', 'currency')}
                  </label>
                  <Input
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    {translator.translate('auth', 'activityDescription')}
                  </label>
                  <textarea
                    rows={3}
                    value={form.activity_description}
                    onChange={(e) => setForm({ ...form, activity_description: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#1E293B] dark:text-[#F5F5F5] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none"
                  />
                </div>
              </div>

              {/* ── Contact ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-[#7C4DFF]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {translator.translate('profile', 'contactInfo')}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'emailLabel')}
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'phoneLabel')}
                    </label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* ── Adresse ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#7C4DFF]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {translator.translate('profile', 'addressInfo')}
                  </h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    {translator.translate('auth', 'street')}
                  </label>
                  <Input
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'city')}
                    </label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'governorate')}
                    </label>
                    <Input
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'country')}
                    </label>
                    <Input
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      {translator.translate('auth', 'postalCode')}
                    </label>
                    <Input
                      value={form.postal_code}
                      onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer fixe */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-[#262626] flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                {translator.translate('profile', 'cancel')}
              </Button>
              <Button className="flex-1" onClick={saveEdit} disabled={saving}>
                {saving
                  ? translator.translate('profile', 'saving')
                  : translator.translate('profile', 'saveChanges')
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Supprimer Bootstrap ── */}
      {deleteModalOpen && companyToDelete && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={closeDeleteModal}
          />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {translator.translate('profile', 'deleteCompany')}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeDeleteModal}
                  />
                </div>

                <div className="modal-body">
                  <p className="text-muted">
                    {translator.translate('profile', 'deleteConfirm')}{' '}
                    <span className="fw-semibold text-dark">
                      {companyToDelete.legal_name}
                    </span>
                    {' '}?
                  </p>
                  <p className="text-danger small mt-2">
                    {translator.translate('profile', 'deleteWarning')}
                  </p>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeDeleteModal}
                  >
                    {translator.translate('profile', 'cancel')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmDelete}
                    disabled={deleting}
                  >
                    {deleting
                      ? translator.translate('profile', 'deleting')
                      : translator.translate('profile', 'delete')
                    }
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