'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input } from '@/components';
import { useTranslation } from '@/providers/I18nProvider';
import { showToast } from 'nextjs-toast-notify';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading]= useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(true);
  const [phoneError, setPhoneError] = useState('');
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setIsFormSubmitted(true);

    event.preventDefault();


    const formData = new FormData(event.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
    };
    if(isPasswordValid === true && isPhoneNumberValid === true && acceptTerms === true){
      setLoading(true);
    try{
      const response= await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        }
      );

     const responseData = await response.json();

      if (!response.ok) {
        displayToast(responseData.message || 'An error occurred during registration.', 'error');
        return;
      }
      else{
        displayToast("If the email is not registered, a confirmation email has been sent", 'success');
        router.push('/login');

      }


    } catch (error) {
      displayToast('Unable to contact the server. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }  
  }
}

function displayToast(message: string, type: 'success' | 'error') {
  if (type === 'success') {
    showToast.success(message, {
        duration: 4000,
        position: "top-right",
        transition: "bounceIn",
        icon: '',
        sound: true,
  });
  } else {
    showToast.error(message, {
        duration: 4000,
        position: "top-right",
        transition: "bounceIn",
        icon: '',
        sound: true,
  });
  }
}

async function onPasswordInputChange(e : React.FormEvent<HTMLInputElement>) {
   const value = (e.target as HTMLInputElement).value;
                if(value.length < 8){
                  setPasswordError("The password must contain at least 8 characters");
                  setIsPasswordValid(false);
                }else{
                  setPasswordError('');
                  setIsPasswordValid(true);
                }
  
}
async function onPhoneInputChange(e : React.FormEvent<HTMLInputElement>) {
  const value = (e.target as HTMLInputElement).value;
  const regex = /^\d{8}$/;
  if(regex.test(value) === false){
      setIsPhoneNumberValid(false);
      setPhoneError("Invalid phone number.");

  }else{
      setIsPhoneNumberValid(true);
      setPhoneError('');
  }
}


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
          {t('auth', 'registerTitle')}
        </h1>
        <p className="mt-2 text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'registerSubtitle')}
        </p>
      </div>

      <Card variant="elevated" padding="lg" className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {t('auth', 'nameLabel')}
            </label>
            <Input
              placeholder="John Doe"
              name="full_name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {t('auth', 'emailLabel')}
            </label>
            <Input
              type="email"
              placeholder="name@company.com"
              name="email"
              required
            />
          </div>
          <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                   {t('auth', 'phoneLabel')}
                </label>
              <Input
                type="tel"
                placeholder="+216 XX XXX XXX"
                name="phone"
                onInput={(e)=> onPhoneInputChange(e)}
              />
              {isFormSubmitted && phoneError && <p className="error text-red-500">{phoneError}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
              {t('auth', 'passwordLabel')}
            </label>
            <Input
              type="password"
              name="password"
              required
              onInput={(e)=> onPasswordInputChange(e)}
            />
            {isFormSubmitted && passwordError && <p className="error text-red-500">{passwordError}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e:React.ChangeEvent<HTMLInputElement>) => setAcceptTerms(e.target.checked)}
              required
            />
            <label htmlFor="acceptTerms" className="text-sm text-[#1E293B] dark:text-[#F5F5F5]" dangerouslySetInnerHTML={{ __html: t('auth', 'termsLabel') }} />

          </div>

          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? 'Inscription en cours...' : t('auth', 'registerButton')}
          </Button>
        </form>

        <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          {t('auth', 'hasAccount')}{' '}
          <Link
            href="/login"
            className="font-medium text-[#7C4DFF] hover:text-[#6D3FEB] dark:text-[#B394FF] dark:hover:text-[#A079FF] hover:underline"
          >
            {t('auth', 'signIn')}
          </Link>
        </div>
      </Card>
    </div>
  );
}