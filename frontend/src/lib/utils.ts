import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitaire pour fusionner les classes Tailwind de manière sûre
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
