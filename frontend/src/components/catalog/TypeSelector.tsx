"use client";

import { Box, Layers, CheckCircle2 } from "lucide-react";

export interface ItemType {
  id: string;
  code: string;
  label: string;
  name?: string;
  description?: string;
}

interface TypeSelectorProps {
  itemTypes: ItemType[];
  selectedTypeId: string;
  onChange: (id: string) => void;
  className?: string;
}

const TYPE_ICONS: Record<string, string> = {
  real_estate: "🏠",
  service:     "🛎️",
  product:     "📦",
  travel:      "✈️",
  training:    "🎓",
  event:       "🎟️",
  software:    "💻",
  vehicle:     "🚗",
};

export function TypeSelector({
  itemTypes,
  selectedTypeId,
  onChange,
  className = "",
}: TypeSelectorProps) {
  if (!itemTypes || itemTypes.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-400 italic">
        <Layers size={24} className="mx-auto mb-2 text-gray-300" />
        Aucun type d'offre disponible
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${className}`}>
      {itemTypes.map(type => {
        const isSelected = selectedTypeId === type.id;
        const icon = TYPE_ICONS[type.code] ?? "📋";

        return (
          <button
            key={type.id}
            onClick={() => onChange(isSelected ? "" : type.id)}
            className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
              isSelected
                ? "border-[#7C4DFF] bg-violet-50 dark:bg-violet-900/20 shadow-md shadow-violet-200/50 dark:shadow-none"
                : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#2A2A2A] hover:border-[#7C4DFF]/40 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {/* Selected check */}
            {isSelected && (
              <CheckCircle2
                size={16}
                className="absolute top-3 right-3 text-[#7C4DFF] fill-violet-100 dark:fill-violet-900"
              />
            )}

            <span className="text-2xl leading-none">{icon}</span>
            <div>
              <p className={`text-sm font-bold leading-tight ${
                isSelected ? "text-[#7C4DFF]" : "text-gray-800 dark:text-white"
              }`}>
                {type.label || type.name}
              </p>
              {type.description && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {type.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
