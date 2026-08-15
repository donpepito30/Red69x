

import React, { memo } from 'react';
import { Model } from '@/lib/types';
import { Eye, Heart, Zap, Play } from 'lucide-react';

interface CompactModelCardProps {
  model: Model;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, model: Model) => void;
  onSelectModel: (model: Model) => void;
}

export const CompactModelCard: React.FC<CompactModelCardProps> = memo(({
  model,
  isFavorite,
  onToggleFavorite,
  onSelectModel,
}) => {
  return (
    <div
      onClick={() => onSelectModel(model)}
      className="group bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-950/20 transition-all duration-200 cursor-pointer flex flex-col relative transform-gpu"
    >
      {/* Media Snapshot */}
      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
        <img
          src={model.snapshotUrl}
          alt={model.displayName}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          <span className="bg-rose-600/90 text-white font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          {model.isHd && (
            <span className="bg-zinc-950/80 text-amber-400 font-bold text-[8px] uppercase px-1 py-0.5 rounded border border-amber-500/30">
              HD
            </span>
          )}
        </div>

        {/* Viewers & Fav (Top Right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <span className="bg-zinc-950/80 text-zinc-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-zinc-800/80 flex items-center gap-1">
            <Eye className="w-2.5 h-2.5 text-rose-400" />
            {model.viewersCount > 999 ? `${(model.viewersCount / 1000).toFixed(1)}k` : model.viewersCount}
          </span>

          <button
            onClick={(e) => onToggleFavorite(e, model)}
            className={`p-1 rounded-md backdrop-blur-md transition border ${
              isFavorite
                ? 'bg-rose-600 border-rose-500 text-white'
                : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:text-rose-400'
            }`}
            title="Favorito"
          >
            <Heart className={`w-3 h-3 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px] z-10">
          <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Bottom Avatar & Name Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 z-10">
          <div className="w-7 h-7 rounded-full border border-rose-500/80 overflow-hidden shrink-0 shadow">
            <img
              src={model.avatarUrl}
              alt={model.displayName}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-xs text-white truncate drop-shadow">
              {model.displayName}
            </div>
            <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
              <span>{model.countryCode.toUpperCase()}</span>
              <span>•</span>
              <span className="text-rose-400 font-bold">{model.tokensPerMin} TK/m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Footer */}
      <div className="px-2.5 py-2 flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-950/60 border-t border-zinc-900">
        <span className="truncate max-w-[120px] font-medium text-zinc-300">
          {model.topic || 'Transmisión en vivo'}
        </span>
        {model.isLovense && (
          <span className="shrink-0 text-amber-400 font-bold flex items-center gap-0.5 bg-amber-950/40 px-1 rounded border border-amber-500/30">
            <Zap className="w-2.5 h-2.5" /> Toy
          </span>
        )}
      </div>
    </div>
  );
});

CompactModelCard.displayName = 'CompactModelCard';
