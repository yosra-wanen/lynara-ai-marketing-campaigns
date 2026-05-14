'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type SectionType = 'crm' | 'catalogue' | 'instagram';

interface SectionContextType {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

export function SectionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function sectionFromPath(path: string): SectionType {
    if (path.startsWith('/instagram')) return 'instagram';
    if (path.startsWith('/catalog'))   return 'catalogue';
    return 'crm';
  }

  const [activeSection, setActiveSection] = useState<SectionType>(() => sectionFromPath(pathname));

  useEffect(() => {
    setActiveSection(sectionFromPath(pathname));
  }, [pathname]);

  return (
    <SectionContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </SectionContext.Provider>
  );
}

export function useSection() {
  const context = useContext(SectionContext);
  if (context === undefined) {
    throw new Error('useSection must be used within a SectionProvider');
  }
  return context;
}
