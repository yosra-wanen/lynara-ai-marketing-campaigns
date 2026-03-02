import { TranslationNamespace } from "@/lib/i18n";
import { useTranslation } from "@/providers/I18nProvider";

export class TranslationService {
    private readonly t = useTranslation().t;
    
    translate(namespace: TranslationNamespace, key: string): string {
        return this.t(namespace, key);
    }

}