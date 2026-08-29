

import React, { useState, useRef, useEffect, memo } from 'react';
import { Model } from '@/lib/types';
import { Eye, Heart, Zap, Play, Volume2, VolumeX } from 'lucide-react';
import { hlsManager } from '@/lib/hlsManager';
import { useAd } from '@/context/AdContext';

interface ModelCardProps {
  model: Model;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, model: Model) => void;
  onSelectModel: (model: Model) => void;
}

export const ModelCard: React.FC<ModelCardProps> = memo(({
  model,
  isFavorite,
  onToggleFavorite,
  onSelectModel,
}) => {
  const { triggerAd, isBlurred } = useAd();
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Suscripción al Singleton global para saber si este video debe estar activo
  useEffect(() => {
    return hlsManager.subscribe((activeId) => {
      const active = activeId === model.id;
      setIsActive(active);
      if (!active && videoRef.current) {
        // Cleanup visual inmediato cuando otro toma el control
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    });
  }, [model.id]);

  // Manejo visual de HLS delegando al Singleton
  useEffect(() => {
    if (isActive && videoRef.current && model.videoUrl && !hasVideoError) {
      hlsManager.play(videoRef.current, model.videoUrl, () => {
        setHasVideoError(true);
      });
    }
  }, [isActive, model.videoUrl, hasVideoError]);

  // IntersectionObserver para Móviles (Auto-Play al hacer scroll)
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile || !cardRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Si la tarjeta está 70% visible en pantalla, toma el Singleton
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          hlsManager.setActiveId(model.id);
        } else if (!entry.isIntersecting && hlsManager.getActiveId() === model.id) {
          hlsManager.setActiveId(null);
        }
      });
    }, {
      threshold: [0, 0.7]
    });

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [model.id]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (window.matchMedia('(max-width: 768px)').matches) return; // Móvil usa scroll
    
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      hlsManager.setActiveId(model.id);
    }, 120);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    
    if (hlsManager.getActiveId() === model.id) {
      hlsManager.setActiveId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const goalPercent = model.goalTarget
    ? Math.min(100, Math.round(((model.goalCurrent || 0) / model.goalTarget) * 100))
    : 0;

  return (
    <div
      ref={cardRef}
      data-model-username={model.username}
      onClick={() => {
        if (isBlurred) {
          triggerAd(model);
        }
        onSelectModel(model);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-950/20 transition-all duration-200 cursor-pointer flex flex-col relative transform-gpu"
    >
      {/* Top Media Area */}
      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
        {/* Snapshot Image with Lazy Loading */}
        <img
          src={model.snapshotUrl}
          alt={model.displayName}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            isActive && !hasVideoError ? 'opacity-0' : 'opacity-100'
          } ${isBlurred ? 'blur-xl opacity-75' : ''}`}
        />

        {/* Video Stream Preview ONLY mounted when active */}
        {isActive && model.videoUrl && !hasVideoError && (
          <video
            ref={videoRef}
            muted={isMuted}
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-all duration-300 ${isBlurred ? 'blur-xl opacity-75' : ''}`}
          />
        )}

        {/* Adsterra Lock Overlay inside card media */}
        {isBlurred && (
          <div className="absolute inset-0 bg-black/45 z-10 flex flex-col items-center justify-center p-2 text-center select-none pointer-events-none animate-in fade-in duration-300">
            {/* Pulsing Red Play Icon */}
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/60 flex items-center justify-center mb-1 animate-pulse shadow-lg shadow-rose-950/50">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-6 h-6 text-rose-500 ml-1"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            <span className="text-white font-black text-[10px] tracking-wider uppercase drop-shadow-sm">
              SALA BLOQUEADA
            </span>
            <span className="text-[9px] text-zinc-300 font-bold mt-0.5">
              Clic para Desbloquear
            </span>
          </div>
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40 pointer-events-none" />

        {/* Live Badges (Top Left) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span className="bg-rose-600 text-white font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md shadow-rose-950/60">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          {model.isHd && (
            <span className="bg-zinc-900/90 backdrop-blur-md text-amber-400 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded border border-amber-500/30">
              HD
            </span>
          )}
          {model.isVr && (
            <span className="bg-purple-900/90 backdrop-blur-md text-purple-300 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded border border-purple-500/30">
              VR 3D
            </span>
          )}
        </div>

        {/* Top Right Badges: Viewers & Favorite */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <span className="bg-zinc-950/80 backdrop-blur-md text-zinc-200 text-xs font-semibold px-2 py-0.5 rounded-full border border-zinc-800 flex items-center gap-1">
            <Eye className="w-3 h-3 text-rose-400" />
            {model.viewersCount.toLocaleString()}
          </span>

          <button
            onClick={(e) => onToggleFavorite(e, model)}
            className={`p-1.5 rounded-full backdrop-blur-md transition border ${
              isFavorite
                ? 'bg-rose-600 border-rose-500 text-white'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:text-rose-400'
            }`}
            title="Guardar en Favoritos"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Hover Audio Toggle */}
        {(isHovered || isActive) && model.videoUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-zinc-950/80 backdrop-blur-md text-zinc-300 hover:text-white z-10 border border-zinc-800"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-rose-400" />}
          </button>
        )}

        {/* Model Avatar & Info Bar over snapshot */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 z-10">
          <div className="relative w-10 h-10 rounded-full border-2 border-rose-500/80 overflow-hidden shrink-0 shadow-lg">
            <img
              src={model.avatarUrl}
              alt={model.displayName}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white truncate drop-shadow">
                {model.displayName}
              </span>
              <span className="text-xs text-zinc-300 font-medium">({model.age})</span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
              <span>{model.country}</span> • <span className="text-rose-400 font-semibold">{model.tokensPerMin} TK/min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body & Goal Progress */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2 bg-gradient-to-b from-zinc-900 to-zinc-950">
        
        {/* Stream Topic / Goal Title */}
        <p className="text-xs font-medium text-zinc-300 line-clamp-2 leading-relaxed">
          {model.topic}
        </p>

        {/* Goal Bar if present */}
        {model.goalTarget && (
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-amber-400 truncate flex items-center gap-1">
                <Zap className="w-3 h-3" /> {model.goalTitle}
              </span>
              <span className="text-zinc-400">
                {model.goalCurrent}/{model.goalTarget} TK ({goalPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Tag Badges */}
        <div className="flex flex-wrap gap-1 mt-1">
          {model.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50"
            >
              #{tag}
            </span>
          ))}
          {model.isLovense && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" /> Lovense
            </span>
          )}
        </div>

        {/* Action CTA */}
        <button className="mt-2 w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-500 font-bold text-xs transition-all flex items-center justify-center gap-1.5 group-hover:shadow-lg group-hover:shadow-rose-950/30">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Ver Stream En Vivo</span>
        </button>

      </div>
    </div>
  );
});

ModelCard.displayName = 'ModelCard';

