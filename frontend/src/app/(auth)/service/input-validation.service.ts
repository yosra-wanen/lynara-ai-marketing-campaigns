import { TranslationService } from "@/app/services/translation.service";

export class InputValidationService {
  private readonly translator = new TranslationService();
  isPasswordValid(password:string) {
    if (password.length < 8) {
      return this.translator.translate('auth', 'passwordTooShort');
    }
    return "";
  } 

  isPhoneNumberValid (phone:string) {
    const regex = /^\d{8}$/;
    if (regex.test(phone) === false) {
      return this.translator.translate('auth', 'invalidPhone');
    }
    return "";
  }

  isConfirmPasswordValid(password:string, confirmPassword:string) {
      if (password == confirmPassword) {
          return "";
      }
      return this.translator.translate('auth', 'passwordsDoNotMatch'); 
  }
}
