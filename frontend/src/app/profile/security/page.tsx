'use client';

import { useState } from 'react';
import { PageHeader, Card, Button, Input, Tabs } from '@/components';
import { Instagram, Globe } from 'lucide-react';
import { TranslationService } from '@/app/services/translation.service';
import { ToastService } from '@/app/services/toast.service';
import { InputValidationService } from '@/app/services/input-validation.service';

export default function ProfileSecurityPage() {
  const translator   = new TranslationService();
  const toastService = new ToastService();
  const validator    = new InputValidationService();

  const [activeTab, setActiveTab] = useState('security');

  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError]         = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isFormSubmitted, setIsFormSubmitted]           = useState(false);

  const [form, setForm] = useState({
    current_password: '',
    new_password:     '',
    confirm_password: '',
  });

  const tabs = [
    { id: 'security',       label: translator.translate('profile', 'tabSecurity') },
    { id: 'connected',      label: translator.translate('profile', 'tabConnected') },
    { id: 'delete-account', label: translator.translate('profile', 'tabDeleteAccount') },
  ];

  const handleChangePassword = () => {
    setIsFormSubmitted(true);

    const currentPassError = validator.isPasswordValid(form.current_password);
    const newPassError     = validator.isPasswordValid(form.new_password);
    const confirmPassError = validator.isConfirmPasswordValid(form.new_password, form.confirm_password);

    setCurrentPasswordError(currentPassError);
    setNewPasswordError(newPassError);
    setConfirmPasswordError(confirmPassError);

    if (currentPassError || newPassError || confirmPassError) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: form.current_password,
        new_password:     form.new_password,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw data.detail;
        return data;
      })
      .then(() => {
        toastService.displayToast(translator.translate('profile', 'passwordChanged'), 'success');
        setForm({ current_password: '', new_password: '', confirm_password: '' });
        setCurrentPasswordError('');
        setNewPasswordError('');
        setConfirmPasswordError('');
        setIsFormSubmitted(false);
      })
      .catch((detail) => {
        const errorMap: Record<string, string> = {
          'WRONG_PASSWORD':         'currentPasswordError',
          'SESSION_EXPIRED':        'sessionExpired',
          'PASSWORD_UPDATE_FAILED': 'passwordError',
          'SERVER_ERROR':           'serverError',
        };
        const key = errorMap[detail] ?? 'passwordError';
        toastService.displayToast(translator.translate('profile', key), 'error');
      });
  };

  const handleCancel = () => {
    setForm({ current_password: '', new_password: '', confirm_password: '' });
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setIsFormSubmitted(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl space-y-8">
      <PageHeader
        title={translator.translate('profile', 'navSecurity')}
        subtitle={translator.translate('profile', 'navSecurityDesc')}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'security' && (
        <Card variant="elevated" padding="lg" className="space-y-6 rounded-2xl border border-gray-100 dark:border-[#262626] shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {translator.translate('profile', 'changePassword')}
          </h3>
          <div className="space-y-4 max-w-3xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                {translator.translate('profile', 'currentPassword')}
              </label>
              <Input
                type="password"
                value={form.current_password}
                onInput={(e) => setForm({ ...form, current_password: e.currentTarget.value })}
              />
              {isFormSubmitted && currentPasswordError && (
                <p className="text-sm text-red-500">{currentPasswordError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                {translator.translate('profile', 'newPassword')}
              </label>
              <Input
                type="password"
                value={form.new_password}
                onInput={(e) => setForm({ ...form, new_password: e.currentTarget.value })}
              />
              {isFormSubmitted && newPasswordError && (
                <p className="text-sm text-red-500">{newPasswordError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                {translator.translate('profile', 'confirmPassword')}
              </label>
              <Input
                type="password"
                value={form.confirm_password}
                onInput={(e) => setForm({ ...form, confirm_password: e.currentTarget.value })}
              />
              {isFormSubmitted && confirmPasswordError && (
                <p className="text-sm text-red-500">{confirmPasswordError}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-[#262626] pt-6">
            <Button variant="outline" onClick={handleCancel}>
              {translator.translate('profile', 'cancel')}
            </Button>
            <Button onClick={handleChangePassword}>
              {translator.translate('profile', 'saveChanges')}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'connected' && (
        <Card variant="elevated" padding="lg" className="space-y-6 rounded-2xl border border-gray-100 dark:border-[#262626]">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262626] pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tab-active text-white">
                <Instagram size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Instagram</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {translator.translate('profile', 'connectedAs')} @lynara_app
                </p>
              </div>
            </div>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30">
              {translator.translate('profile', 'disconnect')}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-700 dark:bg-gray-600 text-white">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Google</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {translator.translate('profile', 'notConnected')}
                </p>
              </div>
            </div>
            <Button variant="primary">
              {translator.translate('profile', 'connect')}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'delete-account' && (
        <Card variant="elevated" padding="lg" className="space-y-4 rounded-2xl border border-gray-100 dark:border-[#262626]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {translator.translate('profile', 'deleteAccount')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {translator.translate('profile', 'deleteAccountWarning')}
          </p>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20">
            {translator.translate('profile', 'deleteAccountBtn')}
          </Button>
        </Card>
      )}
    </div>
  );
}