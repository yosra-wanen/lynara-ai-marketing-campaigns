'use client';

import { IconAgentIA } from './PlatformLogos';
import { CTAWithGlowRings } from './CTAWithGlowRings';
import { cn } from '@/lib/utils';

const SUGGESTION_POSITIONS: Array<{ left: string; top: string }> = [
  { left: '5%', top: '8%' },
  { left: '12%', top: '22%' },
  { left: '68%', top: '10%' },
  { left: '72%', top: '28%' },
  { left: '8%', top: '52%' },
  { left: '70%', top: '48%' },
  { left: '40%', top: '18%' },
];

interface DoItWithAICardProps {
  suggestions: string[];
  buttonLabel: string;
  highlight: string;
  subHighlight?: string;
  description: string;
  className?: string;
}

export function DoItWithAICard({
  suggestions,
  buttonLabel,
  highlight,
  subHighlight,
  description,
  className,
}: DoItWithAICardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl bg-white dark:bg-[#1A1A1A] p-6 sm:p-8 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.3)] min-h-[340px] flex flex-col',
        className
      )}
    >
      {/* Faded labels scattered (like capture) */}
      {suggestions.slice(0, SUGGESTION_POSITIONS.length).map((text, i) => (
        <span
          key={i}
          className="absolute text-xs sm:text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap pointer-events-none"
          style={{
            left: SUGGESTION_POSITIONS[i].left,
            top: SUGGESTION_POSITIONS[i].top,
          }}
        >
          {text}
        </span>
      ))}

      {/* Central button with glow rings (pill shape) */}
      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <CTAWithGlowRings className="rounded-full">
          <button
            type="button"
            className="relative z-10 flex items-center gap-2 rounded-full bg-gradient-button-colored px-6 py-3.5 text-white font-semibold shadow-lg border border-white/20 hover:opacity-95 hover:bg-gradient-button-colored-hover transition-all duration-200"
            aria-label={buttonLabel}
          >
            <IconAgentIA size={22} white className="text-white shrink-0" />
            <span>{buttonLabel}</span>
          </button>
        </CTAWithGlowRings>
        <p className="mt-3 text-sm font-semibold text-[#1E293B] dark:text-[#F5F5F5] text-center">
          {highlight}
        </p>
        {subHighlight && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center">
            {subHighlight}
          </p>
        )}
      </div>

      {/* Description at bottom */}
      <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed text-center mt-auto pt-2">
        {description}
      </p>
    </div>
  );
}
