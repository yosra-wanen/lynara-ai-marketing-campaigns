import { TranslationService } from "@/app/services/translation.service";

export class InputValidationService {
  private readonly translator = new TranslationService();

  private readonly lettersOnlyRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/;
  private readonly numbersOnlyRegex = /^\d+$/;
  private readonly emailRegex       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly phoneRegex       = /^\d{6,15}$/;


  isPasswordValid(password: string): string {
    if (password.length < 8)
      return this.translator.translate('auth', 'passwordTooShort');
    return '';
  }

  isConfirmPasswordValid(password: string, confirmPassword: string): string {
    if (password === confirmPassword) return '';
    return this.translator.translate('auth', 'passwordsDoNotMatch');
  }

  isPhoneNumberValid(phone: string): string {
    if (!phone)                return this.translator.translate('validation', 'required');
    if (!this.phoneRegex.test(phone.replace(/\s/g, ''))) return this.translator.translate('validation', 'invalidPhone');
    return '';
  }

  isEmailValid(email: string): string {
    if (!email)                          return this.translator.translate('validation', 'required');
    if (!this.emailRegex.test(email))    return this.translator.translate('validation', 'invalidEmail');
    return '';
  }

  validateField(name: string, value: string): string {
    switch (name) {

      // ── Lettres uniquement + obligatoire ──
      case 'legal_name':
      case 'director_name':
      case 'industry':
      case 'city':
        if (!value)                              return this.translator.translate('validation', 'required');
        if (!this.lettersOnlyRegex.test(value))  return this.translator.translate('validation', 'lettersOnly');
        return '';

      // ── Chiffres uniquement + obligatoire ──
      case 'capital_social':
        if (!value)                              return this.translator.translate('validation', 'required');
        if (!this.numbersOnlyRegex.test(value))  return this.translator.translate('validation', 'numbersOnly');
        return '';

      // ── Obligatoire uniquement ──
      case 'currency':
      case 'street':
      case 'country':
      case 'state':
        if (!value) return this.translator.translate('validation', 'required');
        return '';

      // ── Email ──
      case 'email':
        return this.isEmailValid(value);

      // ── Téléphone ──
      case 'phone':
        return this.isPhoneNumberValid(value);

      // ── Code postal : chiffres seulement si renseigné (optionnel) ──
      case 'postal_code':
        if (value && !this.numbersOnlyRegex.test(value)) return this.translator.translate('validation', 'numbersOnly');
        return '';

      default:
        return '';
    }
  }

  hasErrors(errors: Record<string, string>): boolean {
    return Object.values(errors).some((e) => e !== '');
  }
}