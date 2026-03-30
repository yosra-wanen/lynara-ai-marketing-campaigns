'use client';

import Link from 'next/link';
import { Card, Button, Input } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // 2. Set generic cookie for middleware if needed
      document.cookie = "access_token=" + data.session?.access_token + "; path=/; max-age=3600";
      
      // 3. Redirect to Catalogue!
      router.push('/catalog');
      
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
          {t('auth', 'loginTitle')}
        </h1>
        <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'loginSubtitle')}
        </p>
      </div>

      <Card variant="elevated" padding="lg" className="space-y-6">
        <form className="space-y-4" onSubmit={handleLogin}>
          {errorMsg && (
             <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center font-medium">
                {errorMsg}
             </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {t('auth', 'emailLabel')}
            </label>
            <Input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                {t('auth', 'passwordLabel')}
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
              >
                {t('auth', 'forgotLink')}
              </Link>
            </div>
            <Input 
              type="password" 
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Connexion..." : t('auth', 'loginButton')}
          </Button>
        </form>

        <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'noAccount')}{' '}
          <Link
            href="/register"
            className="font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
          >
            {t('auth', 'signUp')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
