'use client';

import { useEffect, useRef, useState } from 'react';

const defaultOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: '0px 0px -60px 0px',
  threshold: 0.1,
};

export function useInView(options: IntersectionObserverInit = defaultOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setIsInView(true);
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.root, options.rootMargin, options.threshold]);

  return { ref, isInView };
}
