'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextAreaWithSuggestionProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSuggest?: () => void;
  suggestButtonText?: string;
  className?: string;
}

export function TextAreaWithSuggestion({
  label = 'Template descriptions',
  placeholder = "Ask anything you'd like to know...",
  value,
  onChange,
  onSuggest,
  suggestButtonText = 'Suggest pro..',
  className,
}: TextAreaWithSuggestionProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-[#1E293B] dark:text-[#F5F5F5]">{label}</label>
      )}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={cn(
            'w-full rounded-xl border px-4 py-3 pr-32 transition-all duration-200',
            'border-[#E2E8F0] dark:border-[#3A3A3A]',
            'bg-white/80 dark:bg-[#252525]/80 backdrop-blur-sm',
            'placeholder:text-[#94A3B8] dark:placeholder:text-[#808080] text-[#1E293B] dark:text-[#F5F5F5]',
            'focus:border-[#A079FF] dark:focus:border-[#B394FF] focus:outline-none focus:ring-2 focus:ring-[#A079FF]/20 dark:focus:ring-[#A079FF]/30'
          )}
        />
        {onSuggest && (
          <button
            type="button"
            onClick={onSuggest}
            className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-[#E8E0FF] dark:bg-[#2A2A2A] px-2 py-1 text-sm text-[#7C4DFF] dark:text-[#B394FF] hover:bg-[#D4BDFF]/50 dark:hover:bg-[#3A3A3A] transition-colors"
          >
            <Sparkles size={14} />
            {suggestButtonText}
          </button>
        )}
      </div>
    </div>
  );
}
