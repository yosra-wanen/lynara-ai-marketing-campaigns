'use client';

import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 border-b border-gray-200 dark:border-[#262626]', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-all duration-200 rounded-t-xl',
              isActive
                ? 'bg-tab-active text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
