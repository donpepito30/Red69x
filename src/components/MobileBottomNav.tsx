import React, { memo } from 'react';
import { Flame, SlidersHorizontal, Search, Heart, Coins, Sparkles, Clock } from 'lucide-react';
import { FilterState, Model } from '@/lib/types';
import { useAd } from '@/context/AdContext';

interface MobileBottomNavProps {
  filters: FilterState;
  onOpenFilters: () => void;
  onOpenSearch: () => void;
  onOpenFavorites: () => void;
  onOpenBuyTokens: () => void;
  userTokens: number;
  favoriteModels: Model[];
  onScrollToTop: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = memo(({
  filters,
  onOpenFilters,
  onOpenSearch,
  onOpenFavorites,
  onOpenBuyTokens,
  userTokens,
  favoriteModels,
  onScrollToTop,
}) => {
  const { secondsLeft, freeAccessUntil } = useAd();

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const hasActiveFilters = filters.tags.length > 0 || filters.gender !== 'all' || filters.isLovenseOnly || filters.isHdOnly;

  return (
    <nav 
      aria-label="Navegación móvil inferior"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Active Free Access Bar indicator if timer active */}
      {secondsLeft > 0 && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-rose-950/90 border-b border-emerald-500/20 px-3 py-1 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Acceso Libre 2 Min</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-black text-white bg-black/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 items-center h-15 px-1">
        {/* Tab 1: Explorar / Inicio */}
        <button
          onClick={onScrollToTop}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-zinc-400 hover:text-rose-500 active:scale-95 transition"
        >
          <Flame className="w-5 h-5 text-rose-500" />
          <span className="text-[10px] font-bold mt-1 tracking-tight text-zinc-200">En Vivo</span>
        </button>

        {/* Tab 2: Buscar */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-zinc-400 hover:text-white active:scale-95 transition"
        >
          <Search className="w-5 h-5 text-zinc-400" />
          <span className="text-[10px] font-medium mt-1 tracking-tight text-zinc-400">Buscar</span>
        </button>

        {/* Tab 3: Filtros */}
        <button
          onClick={onOpenFilters}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-zinc-400 hover:text-white active:scale-95 transition relative"
        >
          <div className="relative">
            <SlidersHorizontal className="w-5 h-5 text-zinc-300" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-zinc-950" />
            )}
          </div>
          <span className="text-[10px] font-medium mt-1 tracking-tight text-zinc-300">Filtros</span>
        </button>

        {/* Tab 4: Favoritos */}
        <button
          onClick={onOpenFavorites}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-zinc-400 hover:text-rose-400 active:scale-95 transition relative"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${favoriteModels.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`} />
            {favoriteModels.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[9px] font-black text-white flex items-center justify-center ring-2 ring-zinc-950">
                {favoriteModels.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1 tracking-tight text-zinc-400">Favoritos</span>
        </button>

        {/* Tab 5: Tokens */}
        <button
          onClick={onOpenBuyTokens}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-amber-400 hover:text-amber-300 active:scale-95 transition"
        >
          <div className="flex items-center gap-0.5">
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[10px] font-black mt-1 tracking-tight text-amber-400">
            {userTokens} TK
          </span>
        </button>
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
