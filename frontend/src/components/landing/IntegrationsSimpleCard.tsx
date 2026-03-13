'use client';

import { IconAgentIA } from './PlatformLogos';
import { gradients } from '@/lib/design-system/constants';
import { cn } from '@/lib/utils';

/** Carte droite du design capture : grand cercle IA (dégradé violet + ombre), icône sparkles blanche, point accent magenta en haut à gauche, puis description. */
interface IntegrationsSimpleCardProps {
  description: string;
  className?: string;
}

export function IntegrationsSimpleCard({ description, className }: IntegrationsSimpleCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-[#1A1A1A] p-6 sm:p-8 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.3)] min-h-[340px] flex flex-col items-center justify-center text-center',
        className
      )}
    >
      <div className="relative flex-1 flex items-center justify-center w-full">
        {/* Point accent magenta au-dessus à gauche du cercle */}
        <span
          className="absolute w-3 h-3 rounded-full bg-[#A079FF] shadow-sm z-10 sm:w-3.5 sm:h-3.5"
          style={{ top: '20%', left: '50%', transform: 'translate(-4.5rem, -1.25rem)' }}
          aria-hidden
        />
        {/* Grand cercle : dégradé violet (plus foncé en haut, plus clair en bas) + ombre douce */}
        <div
          className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-[0_8px_24px_-4px_rgba(139,92,246,0.35)] dark:shadow-[0_8px_24px_-4px_rgba(139,92,246,0.4)]"
          style={{ background: gradients.aiCircle }}
        >
          <IconAgentIA size={48} white className="text-white" />
        </div>
      </div>
      <p className="mt-6 text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
