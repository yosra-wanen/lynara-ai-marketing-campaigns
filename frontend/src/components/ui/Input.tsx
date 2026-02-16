'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 transition-all duration-200',
            'bg-gray-50 dark:bg-[#1A1A1A]',
            'focus-within:ring-2 focus-within:ring-[#A079FF]/20 dark:focus-within:ring-[#A079FF]/30 focus-within:border-[#A079FF] dark:focus-within:border-[#B394FF]',
            error ? 'border-red-500' : 'border-transparent dark:border-[#262626]',
            leftIcon && 'pl-3',
            rightIcon && 'pr-3'
          )}
        >
          {leftIcon && <span className="text-gray-400 dark:text-gray-500 shrink-0">{leftIcon}</span>}
          <input
            type={type}
            ref={ref}
            className={cn(
              'h-10 flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          {rightIcon && <span className="text-gray-400 dark:text-gray-500 shrink-0">{rightIcon}</span>}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
