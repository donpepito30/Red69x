

import React, { memo } from 'react';
import { FilterState } from '@/lib/types';
import { Zap, Video, Heart, Radio, Flame, Glasses } from 'lucide-react';

interface CategoryPillsProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const CATEGORIES = [
  { id: 'all', name: 'Todas las Cams', icon: Flame },
  { id: 'Latina', name: 'Latina', icon: Flame },
  { id: 'Lovense', name: 'Lovense Toy ⚡', icon: Zap },
  { id: 'Cosplay', name: 'Cosplay', icon: Heart },
  { id: 'VR Cams', name: 'Gafas VR 3D', icon: Glasses },
  { id: 'HD 1080p', name: 'HD 1080p', icon: Video },
  { id: 'Petite', name: 'Petite', icon: Heart },
  { id: 'MILF', name: 'MILF / Maduras', icon: Heart },
  { id: 'Pareja', name: 'Parejas', icon: Heart },
  { id: 'Tatuajes', name: 'Tatuajes & Ink', icon: Radio },
];

export const CategoryPills: React.FC<CategoryPillsProps> = memo(({ filters, setFilters }) => {
  const toggleTag = (tag: string) => {
    if (tag === 'all') {
      setFilters((prev) => ({ ...prev, tags: [], isLovenseOnly: false, isHdOnly: false }));
      return;
    }

    setFilters((prev) => {
      const isCurrentlySelected = prev.tags.includes(tag);
      return {
        ...prev,
        tags: isCurrentlySelected ? [] : [tag], // Direct single category switch
      };
    });
  };

  return (
    <div className="bg-zinc-950/60 border-b border-zinc-900 py-3 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-rose-500" /> Categorías:
        </span>

        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = cat.id === 'all' ? filters.tags.length === 0 : filters.tags.includes(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => toggleTag(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40 border border-rose-400/30'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

CategoryPills.displayName = 'CategoryPills';

