'use client';

import React, { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';

export type SectionType = 'crm' | 'catalogue';

interface SectionContextType {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

export function SectionProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<SectionType>('crm');
  const pathname = usePathname();

  // Simple heuristic: if path contains 'products' or 'inventory' or 'catalogue', switch to catalogue
  // This is optional if we want URL persistence. For now, manual switch is fine or path-based.
  // Let's stick to manual + default based on route if needed.
  
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
