'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
        success: 'bg-[#E5EF8E]/50 dark:bg-[#B5C94A]/30 text-gray-800 dark:text-[#EEF49E]',
        primary: 'bg-gradient-button-primary text-white',
        accent: 'bg-gradient-button-colored text-white shadow-sm',
        count: 'bg-tab-active text-white min-w-[1.25rem] justify-center',
        outline: 'border border-[#E2E8F0] dark:border-[#3A3A3A] bg-transparent',
        warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
        error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
