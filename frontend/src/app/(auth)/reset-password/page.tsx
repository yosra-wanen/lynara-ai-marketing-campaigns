'use client';
import { FormEvent, useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components';
import { InputValidationService } from '../../services/input-validation.service';
import { ToastService } from '@/app/services/toast.service';
import { useRouter } from 'next/dist/client/components/navigation';
import { UrlParserService } from '../service/url-parser.service';
import { TranslationService } from '@/app/services/translation.service';
import { SupabaseService } from '@/app/services/supabase.service';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const toastService = new ToastService();
    const validator = new InputValidationService();
    const urlParser = new UrlParserService();
    const translator = new TranslationService();
    const supabaseService=new SupabaseService();

    useEffect(() => {
        const { accessToken, refreshToken, type } = urlParser.getTokenFromHash();
        if (!accessToken || type !== 'recovery') {
            toastService.displayToast(translator.translate('auth', 'resetLinkExpired'), 'error');
            console.log('Invalid or missing access token in URL hash');
            router.push('/login');
            return;
        }
        supabaseService.setSession(accessToken, refreshToken)
        .catch((error) => {
            if (error) {
                console.log('Error setting session:', error);
                toastService.displayToast(translator.translate('auth', 'resetLinkExpired'), 'error');
                router.push('/login');
            }
        });
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        setIsFormSubmitted(true);
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const password = formData.get('password') as string;
        if (passwordError === '' && confirmPasswordError === '') {
            setLoading(true);
            try {
                const response = await supabaseService.updateUser(password);

                if (response.error) {
                    toastService.displayToast(response.error.message || translator.translate('auth', 'requestError'), 'error');
                    return;
                }
                else {
                    toastService.displayToast(translator.translate('auth', 'resetSuccess'), 'success');
                    router.push('/login');
                }

            } catch (error) {
                toastService.displayToast(translator.translate('auth', 'serverError'), 'error');
            } finally {
                setLoading(false);
            }
        }
    }
    async function onPasswordInputChange(e: React.FormEvent<HTMLInputElement>) {
        const value = (e.target as HTMLInputElement).value;
        const errorMessage = validator.isPasswordValid(value);
        setPasswordError(errorMessage);
    }
    async function onConfirmPasswordInputChange(e: React.FormEvent<HTMLInputElement>) {
        const value = (e.target as HTMLInputElement).value;
        const passwordValue = (document.getElementById('passwordId') as HTMLInputElement).value;
        const errorMessage = validator.isConfirmPasswordValid(passwordValue, value);
        setConfirmPasswordError(errorMessage);
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-[#1E293B] dark:text-[#F5F5F5]">
                    {translator.translate('auth', 'resetTitle')}
                </h1>
            </div>

            <Card variant="elevated" padding="lg" className="space-y-6">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                                {translator.translate('auth', 'passwordLabel')}
                            </label>
                        </div>
                        <Input type="password"
                            name="password"
                            id="passwordId"
                            required
                            onInput={(e) => onPasswordInputChange(e)}
                        />
                        {isFormSubmitted && passwordError && <p className="error text-red-500">{passwordError}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">
                                {translator.translate('auth', 'confirmPasswordLabel')}
                            </label>
                        </div>
                        <Input type="password"
                            name="confirmPassword"
                            id="confirmPasswordId"
                            required
                            onInput={(e) => onConfirmPasswordInputChange(e)}
                        />
                        {isFormSubmitted && confirmPasswordError && <p className="error text-red-500">{confirmPasswordError}</p>}
                    </div>

                    <Button className="w-full" size="lg" disabled={loading}>
                        { translator.translate('auth', loading?'resetting':'resetButton')}
                    </Button>
                </form>

            </Card>
        </div>
    );
}

