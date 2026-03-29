'use client';

import { useEffect, useState, useRef } from 'react';
import { PageHeader, Card, Button, Input, Avatar } from '@/components';
import { Upload } from 'lucide-react';
import { ToastService } from '@/app/services/toast.service';
import { TranslationService } from '@/app/services/translation.service';

type Profile = {
  user_id:    string;
  email:      string;
  full_name:  string;
  phone:      string;
  is_admin:   boolean;
  avatar_url: string | null;
};

export default function ProfileMePage() {
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]     = useState(true);
  const toastService              = new ToastService();
  const translator                = new TranslationService();

  const [profile, setProfile] = useState<Profile>({
    user_id:    '',
    email:      '',
    full_name:  '',
    phone:      '',
    is_admin:   false,
    avatar_url: null,
  });

  const [form, setForm] = useState({
    full_name: '',
    email:     '',
    phone:     '',
  });

  const fetchProfile = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/me`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw body.detail;
        return body;
      })
      .then((response) => {
        const data = response.data;
        setProfile({
          user_id:    data.user_id    || '',
          email:      data.email      || '',
          full_name:  data.full_name  || '',
          phone:      data.phone      || '',
          is_admin:   data.is_admin   || false,
          avatar_url: data.avatar_url || null,
        });
        setForm({
          full_name: data.full_name || '',
          email:     data.email     || '',
          phone:     data.phone     || '',
        });
      })
      .catch(() => {
        toastService.displayToast(translator.translate('profile', 'fetchError'), 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/me/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw body.detail;
        return body;
      })
      .then((response) => {
        setProfile((prev) => ({ ...prev, avatar_url: response.data.avatar_url }));
        toastService.displayToast(translator.translate('profile', 'avatarSuccess'), 'success');
      })
      .catch((detail) => {
        toastService.displayToast(detail, 'error');
      })
      .finally(() => setUploading(false));
  };

  const handleSave = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/me`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        phone:     form.phone,
        email:     form.email !== profile.email ? form.email : null,
      }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw body.detail;
        return body;
      })
      .then(() => {
        toastService.displayToast(translator.translate('profile', 'updateSuccess'), 'success');
        fetchProfile();
      })
      .catch((detail) => {
        toastService.displayToast(detail, 'error');
      });
  };

  const handleCancel = () => {
    setForm({
      full_name: profile.full_name,
      email:     profile.email,
      phone:     profile.phone,
    });
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl space-y-8">
        <PageHeader
          title={translator.translate('profile', 'title')}
          subtitle={translator.translate('profile', 'subtitle')}
        />
        <div className="flex items-center justify-center py-20">
          <div className="spinner-border" role="status" style={{ color: '#7C4DFF' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl space-y-8">
      <PageHeader
        title={translator.translate('profile', 'title')}
        subtitle={translator.translate('profile', 'subtitle')}
      />

      <Card variant="elevated" padding="lg" className="space-y-8 rounded-2xl border border-gray-100 dark:border-[#262626] shadow-card">
        <div className="flex items-center gap-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="relative cursor-pointer" onClick={handleAvatarClick}>
            <Avatar
              size="xl"
              src={profile.avatar_url}
              fallback={profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              className="ring-2 ring-gray-100 dark:ring-[#262626]"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <span className="text-white text-xs">...</span>
              </div>
            )}
          </div>
          <div>
            <Button
              variant="outline"
              leftIcon={<Upload size={16} />}
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              {uploading
                ? translator.translate('profile', 'uploading')
                : translator.translate('profile', 'uploadAvatar')
              }
            </Button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {translator.translate('profile', 'avatarHint')}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              {translator.translate('profile', 'fullName')}
            </label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              {translator.translate('profile', 'email')}
            </label>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              {translator.translate('profile', 'phone')}
            </label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              {translator.translate('profile', 'language')}
            </label>
            <Input defaultValue="English" />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-[#262626] pt-6">
          <Button variant="outline" onClick={handleCancel}>
            {translator.translate('profile', 'cancel')}
          </Button>
          <Button onClick={handleSave}>
            {translator.translate('profile', 'saveChanges')}
          </Button>
        </div>
      </Card>
    </div>
  );
}