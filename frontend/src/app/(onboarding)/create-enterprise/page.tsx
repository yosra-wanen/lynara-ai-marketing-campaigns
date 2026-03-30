'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';


export default function CreateEnterprisePage() {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    legal_name: '',
    industry: '',
    email: '',
    phone: '',
    country: '',
  });


  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Recuperer le user pour l'associer a l'entreprise
      const { data: { user } } = await supabase.auth.getUser();

      // Utilisation du port 8002 et 127.0.0.1 (stable)
      const res = await fetch('http://127.0.0.1:8002/company/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legal_name: form.legal_name,
          industry: form.industry,
          email: form.email,
          phone: form.phone,
          country: form.country,
          user_id: user?.id,
        }),

      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Backend error:', errText);
        throw new Error(`Erreur lors de la création: ${errText}`);
      }

      const companyData = await res.json();
      console.log('Created Company:', companyData);

      const newCompanyId = companyData.id || companyData.company_id;

      if (!newCompanyId) {
         throw new Error('ID introuvable dans la réponse');
      }

      if (user && newCompanyId) {
        // 2. Mettre à jour les métadonnées de l'utilisateur dans Supabase (important pour useAuth)
        await supabase.auth.updateUser({
          data: { 
            company_id: newCompanyId,
            active_company_id: newCompanyId 
          }
        });
      }

      setMessage('Entreprise créée avec succès ✅ Redirection...');
      
      // 3. Redirection vers le dashboard/catalog
      setTimeout(() => {
        router.push('/catalog');
      }, 1500);

    } catch (err) {
      console.error(err);
      setMessage('Erreur lors de la création de l\'entreprise ❌');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-page dark:bg-gradient-page-dark p-4">
      <div className="w-full max-w-lg space-y-8">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
            {t('auth', 'createEnterpriseTitle')}
          </h1>
          <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
            {t('auth', 'createEnterpriseSubtitle')}
          </p>
        </div>

        <Card variant="elevated" padding="lg" className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* LEGAL NAME */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nom légal de l'entreprise
              </label>
              <Input
                name="legal_name"
                value={form.legal_name}
                onChange={handleChange}
                placeholder="ex: Acme Inc."
                required
              />
            </div>

            {/* INDUSTRY */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('auth', 'industry')}
              </label>
              <Input
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="Marketing, Tech, Retail..."
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('auth', 'emailLabel')}
              </label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="contact@entreprise.com"
              />
            </div>

            {/* PHONE */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Téléphone
              </label>
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+216 ..."
              />
            </div>

            {/* COUNTRY */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Pays
              </label>
              <Input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Tunisia, France..."
              />
            </div>


            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creation...' : t('auth', 'createButton')}
            </Button>

            {message && (
              <p className="text-center text-sm mt-2">
                {message}
              </p>
            )}

          </form>
        </Card>

      </div>
    </div>
  );
}