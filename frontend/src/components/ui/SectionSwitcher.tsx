'use client';

import { useSection } from '@/providers/SectionProvider';
import { cn } from '@/lib/utils';
import { LayoutGrid, ShoppingBag } from 'lucide-react';

export function SectionSwitcher() {
  const { activeSection, setActiveSection } = useSection();

  return (
    <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-[#262626] p-1">
      <button
        onClick={() => setActiveSection('crm')}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
          activeSection === 'crm'
            ? 'bg-white text-[#7C4DFF] shadow-sm dark:bg-[#121212] dark:text-[#B394FF] ring-1 ring-black/5 dark:ring-white/10'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        )}
      >
        <LayoutGrid size={16} />
        <span>CRM</span>
      </button>
      <button
        onClick={() => setActiveSection('catalogue')}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
          activeSection === 'catalogue'
            ? 'bg-white text-[#7C4DFF] shadow-sm dark:bg-[#121212] dark:text-[#B394FF] ring-1 ring-black/5 dark:ring-white/10'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        )}
      >
        <ShoppingBag size={16} />
        <span>Catalogue</span>
      </button>
    </div>
  );
}
