'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-button-primary text-white shadow-md hover:bg-gradient-button-primary-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500',
        secondary: 'bg-gradient-button-colored text-white shadow-md hover:bg-gradient-button-colored-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-[#A079FF] dark:focus-visible:ring-[#B394FF]',
        outline: 'border-2 border-gray-200 dark:border-[#3A3A3A] bg-transparent hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] dark:hover:bg-[#2A2A2A] focus-visible:ring-gray-300 dark:focus-visible:ring-[#3A3A3A]',
        ghost: 'bg-transparent hover:bg-gray-50 dark:hover:bg-[#2A2A2A] focus-visible:ring-gray-200 dark:focus-visible:ring-[#3A3A3A]',
        link: 'text-gray-900 dark:text-white underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
