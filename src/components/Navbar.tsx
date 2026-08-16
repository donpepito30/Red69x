

import React, { useState, useEffect, memo } from 'react';
import { Search, Flame, Heart, Coins, SlidersHorizontal, X } from 'lucide-react';
import { Gender, FilterState, Model } from '@/lib/types';

interface NavbarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  userTokens: number;
  onOpenBuyTokens: () => void;
  onToggleFilterDrawer: () => void;
  favoriteModels: Model[];
  onSelectModel: (model: Model) => void;
}

export const Navbar: React.FC<NavbarProps> = memo(({
  filters,
  setFilters,
  userTokens,
  onOpenBuyTokens,
  onToggleFilterDrawer,
  favoriteModels,
  onSelectModel,
}) => {
  const [showFavorites, setShowFavorites] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync local search with external filter clears
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== localSearch) {
        setFilters((prev) => ({ ...prev, search: localSearch }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setFilters, filters.search]);

  const genderOptions: { id: Gender | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: '🔥' },
    { id: 'female', label: 'Mujeres', icon: '💋' },
    { id: 'couple', label: 'Parejas', icon: '👩‍❤️‍👨' },
    { id: 'trans', label: 'Trans', icon: '✨' },
    { id: 'male', label: 'Hombres', icon: '💪' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Live Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setFilters((prev) => ({ ...prev, gender: 'all', search: '', tags: [] }))}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/60 group-hover:scale-105 transition">
                <span className="font-black text-white text-base tracking-tighter">R69</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-wider text-white flex items-center">
                  redex<span className="text-rose-500">69</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Live HD Cams
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por modelo, nacionalidad o tema..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-500 pl-10 pr-9 py-2 rounded-full border border-zinc-800 focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
              />
              {localSearch && (
                <button
                  onClick={() => { setLocalSearch(''); setFilters((prev) => ({ ...prev, search: '' })); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Gender Tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-full border border-zinc-800">
            {genderOptions.map((item) => {
              const isActive = filters.gender === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setFilters((prev) => ({ ...prev, gender: item.id }))}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Actions & User Balance */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Filter Toggle */}
            <button
              onClick={onToggleFilterDrawer}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
              title="Filtros avanzados"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Favorites Drawer Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-rose-400 transition relative"
                title="Modelos Favoritas"
              >
                <Heart className={`w-4 h-4 ${favoriteModels.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                {favoriteModels.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center">
                    {favoriteModels.length}
                  </span>
                )}
              </button>

              {/* Favorites Dropdown */}
              {showFavorites && (
                <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      Guardados ({favoriteModels.length})
                    </span>
                    <button onClick={() => setShowFavorites(false)} className="text-zinc-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {favoriteModels.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-xs">
                      No has guardado modelos favoritas aún.
                      <br />¡Haz clic en el corazón de cualquier modelo!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {favoriteModels.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            onSelectModel(m);
                            setShowFavorites(false);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/80 cursor-pointer transition group"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                            <img src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-rose-400 truncate">
                              {m.displayName}
                            </div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <span>{m.country}</span> • <span>{m.viewersCount} viewers</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Token Wallet */}
            <div className="flex items-center bg-zinc-900 rounded-xl p-1 border border-zinc-800">
              <div className="flex items-center gap-1.5 px-2.5 py-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300">{userTokens}</span>
                <span className="text-[10px] text-zinc-400 uppercase hidden sm:inline">TK</span>
              </div>
              <button
                onClick={onOpenBuyTokens}
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-zinc-950 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow-md shadow-amber-950/20"
              >
                + Comprar
              </button>
            </div>

          </div>

        </div>

      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';

