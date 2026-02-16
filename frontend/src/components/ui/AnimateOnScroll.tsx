'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
}

export function AnimateOnScroll({ children, className, delay = 0 }: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsVisible(true);
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayClass = {
    0: '',
    1: 'animate-on-scroll-delay-1',
    2: 'animate-on-scroll-delay-2',
    3: 'animate-on-scroll-delay-3',
    4: 'animate-on-scroll-delay-4',
    5: 'animate-on-scroll-delay-5',
  }[delay];

  return (
    <div
      ref={ref}
      className={cn(
        'animate-on-scroll',
        delayClass,
        isVisible && 'is-visible',
        className
      )}
    >
      {children}
    </div>
  );
}
