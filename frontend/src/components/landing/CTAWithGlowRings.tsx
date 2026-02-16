'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Wraps the main CTA button with concentric pulsating rings (same design as "Do it with AI" capture). */
export function CTAWithGlowRings({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Concentric glow rings - scale + fade out */}
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border-2 border-[#A079FF]/50 dark:border-[#B394FF]/40"
          style={{
            animation: 'glow-ring 2s ease-out infinite',
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
      {children}
    </div>
  );
}
