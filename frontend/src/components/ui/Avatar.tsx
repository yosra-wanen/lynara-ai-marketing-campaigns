'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const initials = fallback
      ? fallback
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E0E0E0] font-semibold text-[#666]',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt ?? ''} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
