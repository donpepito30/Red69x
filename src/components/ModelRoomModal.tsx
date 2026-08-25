

import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Model, ChatMessage, TipOption } from '@/lib/types';
import { INITIAL_CHAT_MESSAGES } from '@/lib/mockModelsData';
import { CompactModelCard } from './CompactModelCard';
import { useAd } from '@/context/AdContext';
import {
  X,
  Send,
  Coins,
  Zap,
  Volume2,
  VolumeX,
  Maximize,
  Heart,
  Eye,
  Gift,
  ShieldCheck,
  Info,
  Lock,
  MessageSquare,
  Play,
  RotateCcw,
  CheckCircle2,
  Flame,
  Radio,
  Share2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface ModelRoomModalProps {
  model: Model;
  onClose: () => void;
  userTokens: number;
  setUserTokens: React.Dispatch<React.SetStateAction<number>>;
  onOpenBuyTokens: () => void;
  isFavorite: boolean;
  onToggleFavorite: (model: Model) => void;
  models: Model[];
  onSelectModel?: (model: Model) => void;
}

export const ModelRoomModal: React.FC<ModelRoomModalProps> = ({
  model,
  onClose,
  userTokens,
  setUserTokens,
  onOpenBuyTokens,
  isFavorite,
  onToggleFavorite,
  models,
  onSelectModel,
}) => {
  const { triggerAd, isBlurred } = useAd();
  const [activeTab, setActiveTab] = useState<'chat' | 'tips' | 'bio' | 'gallery'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [streamSource, setStreamSource] = useState<'video' | 'iframe'>('video');
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [resolution, setResolution] = useState<'auto' | '1080p' | '720p' | '240p'>('auto');

  const activeStreamUrl =
    resolution === '240p'
      ? model.streamUrls?.['240p'] || model.videoUrl
      : resolution === '720p'
      ? model.streamUrls?.['480p'] || model.videoUrl
      : resolution === '1080p'
      ? model.streamUrls?.original || model.videoUrl
      : model.videoUrl; // Auto uses main stream with ABR

  const [isLovenseVibrating, setIsLovenseVibrating] = useState(false);
  const [floatingTokens, setFloatingTokens] = useState<Array<{ id: number; amount: number; x: number; y: number }>>([]);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [privateSeconds, setPrivateSeconds] = useState(0);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [modelGoal, setModelGoal] = useState({
    current: model.goalCurrent || 850,
    target: model.goalTarget || 1000,
    title: model.goalTitle || 'Meta de Baile Sensual',
  });

  // Smart Cropping Engine (Encuadre Inteligente)
  const isVertical = model.broadcastMobile || (model.streamWidth && model.streamHeight && model.streamHeight > model.streamWidth) || false;
  // If vertical video: on mobile use cover (fills vertically perfectly), on desktop use contain (to prevent head chopping)
  // If horizontal video: on mobile use contain (to prevent extreme left/right chopping), on desktop use cover (fills horizontally perfectly)
  const videoObjectFitClass = isVertical
    ? "object-cover sm:object-contain"
    : "object-contain sm:object-cover";

  const [visibleCount, setVisibleCount] = useState<number>(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 12, models.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [models.length]);

  const gridModels = React.useMemo(() => models.filter((m) => m.id !== model.id), [models, model.id]);
  const visibleModels = gridModels.slice(0, visibleCount);

  const relatedModels = React.useMemo(() => {
    return models
      .filter((m) => m.id !== model.id && (m.gender === model.gender || m.ethnicity === model.ethnicity))
      .slice(0, 8);
  }, [models, model]);

  // Handle ESC key to go back / close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Target the video element directly for native hardware-accelerated full screen rendering
      const target = videoRef.current || videoContainerRef.current;
      if (target) {
        target.requestFullscreen().catch((err) => {
          console.warn('Error attempting to enable fullscreen:', err);
        });
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Initialize optimized HLS live stream player with adaptive buffering
  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem || streamSource !== 'video' || !activeStreamUrl) return;

    let hls: Hls | null = null;
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    
    setVideoError(false);

    const isHlsUrl = activeStreamUrl.includes('.m3u8');

    const initPlayer = () => {
      if (hls) {
        hls.destroy();
      }

      if (isHlsUrl && videoElem.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari / iOS)
        videoElem.src = activeStreamUrl;
        videoElem.play().catch(() => {});
        videoElem.onerror = () => {
           setVideoError(true);
           const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
           retryCount++;
           retryTimeout = setTimeout(initPlayer, delay);
        };
      } else if (isHlsUrl && Hls.isSupported()) {
        // Fortified High-Performance HLS Config for ultra-stable live streaming
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          capLevelToPlayerSize: false,
          maxBufferLength: 45,
          maxMaxBufferLength: 90,
          maxBufferSize: 90 * 1024 * 1024,
          backBufferLength: 15,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          progressive: true,
          startLevel: -1,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 5,
          levelLoadingTimeOut: 10000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
        });

        hls.loadSource(activeStreamUrl);
        hls.attachMedia(videoElem);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          retryCount = 0; // Reset backoff on success
          setVideoError(false);
          videoElem.play().catch((err) => {
            console.warn('Autoplay prevented by browser:', err);
          });
        });

        // Advanced auto-recovery for smooth uninterrupted live streaming
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) {
            console.warn('HLS stream error detected, triggering connection recovery:', data.type);
            setVideoError(true);
            
            // Exponential backoff retry logic running in the background
            const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
            console.log(`[Auto-Retry] Reintentando conexión HLS en ${delay}ms...`);
            retryCount++;
            clearTimeout(retryTimeout);
            retryTimeout = setTimeout(initPlayer, delay);
          }
        });
      } else {
        // Native playback for MP4 or other direct video formats
        videoElem.src = activeStreamUrl;
        videoElem.play().catch((err) => {
          console.warn('Native video autoplay prevented by browser:', err);
        });
        videoElem.onerror = () => {
           setVideoError(true);
        };
      }
    };

    initPlayer();

    return () => {
      clearTimeout(retryTimeout);
      if (hls) {
        hls.destroy();
      }
      if (videoElem) {
        videoElem.pause();
        videoElem.removeAttribute('src');
        videoElem.onerror = null;
        videoElem.load();
      }
    };
  }, [activeStreamUrl, streamSource]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Private mode timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPrivateMode) {
      interval = setInterval(() => {
        setPrivateSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPrivateMode]);

  // Handle user sending text message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user_msg_${messages.length + 1}`,
      sender: 'Tú (Usuario VIP)',
      message: inputText,
      timestamp: timeStr,
      badge: 'VIP',
    };

    setMessages((prev) => [...prev, userMsg]);
    const sentText = inputText;
    setInputText('');

    // Trigger AI response from Model using Gemini API
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sentText,
          modelUsername: model.username,
        }),
      });
      const data = await res.json();
      
      setTimeout(() => {
        const modelReply: ChatMessage = {
          id: `model_reply_${Date.now()}`,
          sender: model.displayName,
          avatar: model.avatarUrl,
          message: data.text || `¡Awww gracias mi vida por chatear conmigo! 🔥`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isModel: true,
        };
        setMessages((prev) => [...prev, modelReply]);
      }, 1200);
    } catch {
      // Fallback response
      setTimeout(() => {
        const modelReply: ChatMessage = {
          id: `model_reply_${Date.now()}`,
          sender: model.displayName,
          avatar: model.avatarUrl,
          message: `¡Hola mi amor! Gracias por tu mensaje. ¡Disfruta el show en vivo y envía tokens para hacerme vibrar! 🔥`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isModel: true,
        };
        setMessages((prev) => [...prev, modelReply]);
      }, 1000);
    }
  };

  // Handle tipping tokens
  const handleSendTip = (tokens: number, tipActionLabel?: string) => {
    if (userTokens < tokens) {
      onOpenBuyTokens();
      return;
    }

    // Deduct user tokens
    setUserTokens((prev) => prev - tokens);

    // Update model goal
    setModelGoal((prev) => ({
      ...prev,
      current: prev.current + tokens,
    }));

    // Trigger Lovense animation
    setIsLovenseVibrating(true);
    setTimeout(() => setIsLovenseVibrating(false), 3000);

    // Add floating token animation
    const animId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `anim_${floatingTokens.length + 1}`;
    const newAnim = {
      id: animId,
      amount: tokens,
      x: 30 + (tokens % 40),
      y: 20 + (tokens % 30),
    };
    setFloatingTokens((prev) => [...prev, newAnim as any]);
    setTimeout(() => {
      setFloatingTokens((prev) => prev.filter((a) => a.id !== (animId as any)));
    }, 2000);

    // Add tip message to chat
    const tipMsg: ChatMessage = {
      id: `tip_${animId}`,
      sender: 'Tú (Usuario VIP)',
      message: tipActionLabel ? `¡Propina de ${tokens} TK enviada para: ${tipActionLabel}! ⚡` : `¡Envió ${tokens} TK de propina! 💎`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTip: true,
      tipAmount: tokens,
      badge: 'TOP_TIPPER',
    };

    setMessages((prev) => [...prev, tipMsg]);

    // Model reaction
    setTimeout(() => {
      const reactionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `react_${messages.length + 1}`;
      const modelReaction: ChatMessage = {
        id: reactionId,
        sender: model.displayName,
        avatar: model.avatarUrl,
        message: `¡WOOW! ¡Gracias amor por esos ${tokens} TOKENS! Siento la vibración del Lovense riquísimo 😍🔥🔥`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isModel: true,
      };
      setMessages((prev) => [...prev, modelReaction]);
    }, 1500);

  };


  // Start Private session
  const handleStartPrivate = () => {
    if (userTokens < model.tokensPerMin) {
      onOpenBuyTokens();
      return;
    }
    setIsPrivateMode(true);
    setShowPrivateModal(false);
    setUserTokens((prev) => prev - model.tokensPerMin);
  };

  const goalPercent = Math.min(100, Math.round((modelGoal.current / modelGoal.target) * 100));

  return (
    <div
      data-model-username={model.username}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-y-auto cursor-pointer"
    >
      <div
        data-model-username={model.username}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-zinc-800 md:rounded-3xl w-full max-w-6xl flex flex-col shadow-2xl relative cursor-default md:my-auto overflow-hidden h-full md:h-[90vh]"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition"
          style={{ zIndex: 60 }}
          title="Cerrar sala"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto w-full no-scrollbar relative flex flex-col">
          {/* Top Section: Split Layout */}
          <div className="flex flex-col lg:flex-row w-full shrink-0" style={{ minHeight: '100%' }}>
            
            {/* LEFT COLUMN: Video Stream & Player Controls */}
            <div className="lg:w-7/12 xl:w-2/3 bg-black flex flex-col relative border-b lg:border-b-0 lg:border-r border-zinc-800/80">
          
           {/* Main Video Stage */}
          <div ref={videoContainerRef} className="relative h-[260px] sm:h-[320px] lg:h-[400px] bg-zinc-950 flex items-center justify-center overflow-hidden shrink-0">
            {/* Blurred Background Snapshot - Acts as dynamic ambient letterbox filler */}
            <img
              src={model.snapshotUrl || model.avatarUrl}
              alt={model.displayName}
              className={`absolute inset-0 w-full h-full object-cover scale-110 transition-opacity duration-700 ${videoError ? 'opacity-100 blur-sm' : 'opacity-40 blur-xl'} ${isBlurred ? 'blur-2xl opacity-75' : ''}`}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

            {/* Live Stream Container: HTML5 HLS Video with Smart Cropping */}
            <video
              ref={videoRef}
              autoPlay
              muted={isMuted}
              playsInline
              poster={model.snapshotUrl || model.avatarUrl}
              className={`absolute inset-0 w-full h-full ${videoObjectFitClass} z-10 transition-opacity duration-500 ${videoError ? 'opacity-0' : 'opacity-100'} ${isBlurred ? 'blur-2xl opacity-75' : ''}`}
              onPlay={() => setVideoError(false)}
            />

            {/* Overlay red lock directly on the blurred stream player */}
            {isBlurred && (
              <div className="absolute inset-0 z-30 bg-black/40 flex flex-col items-center justify-center p-4 text-center cursor-pointer animate-in fade-in duration-300">
                {/* Pulsing Red Lock Icon */}
                <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/60 flex items-center justify-center mb-3 animate-pulse">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    className="w-8 h-8 text-red-500"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <span className="text-white font-black text-sm tracking-widest uppercase mb-1 drop-shadow-md">
                  Contenido Protegido
                </span>
                <span className="text-rose-400 font-extrabold text-[11px] uppercase bg-rose-950/70 border border-rose-500/30 px-3 py-1 rounded-full animate-bounce">
                  Clic aquí para Desbloquear Vivo HD
                </span>
              </div>
            )}

            {/* Unobtrusive Reconnecting Overlay (when video errors out) */}
            {videoError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="relative mb-4">
                  <img
                    src={model.avatarUrl || model.snapshotUrl}
                    alt={model.displayName}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-rose-500/50 shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 items-center justify-center text-[10px] text-white">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    </span>
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-white flex items-center justify-center gap-2 drop-shadow-md">
                  <span>@{model.username}</span>
                </h3>
                <p className="text-xs text-zinc-300 mt-1 max-w-xs drop-shadow-md font-medium">
                  La transmisión experimenta intermitencias. Reconectando señal automáticamente...
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setVideoError(false);
                      setStreamSource('video'); // Forces re-render of HLS logic if we add dependency
                    }}
                    className="py-2 px-4 bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs rounded-xl backdrop-blur-md transition shadow-lg flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reintentar ahora
                  </button>
                  <a
                    href={model.chatUrl || `https://stripcash.com/live/${model.username}?aff=aff_velvet_101`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-4 bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-bold text-xs rounded-xl backdrop-blur-md border border-zinc-700/50 transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4 text-rose-400" />
                    Canal Oficial
                  </a>
                </div>
              </div>
            )}

            {/* Dark Gradient Vignette Overlay (Pointer events disabled so iframe stays interactive) */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/40 pointer-events-none z-10" />

            {/* Floating Tokens Animation */}
            {floatingTokens.map((item) => (
              <div
                key={item.id}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className="absolute z-30 animate-bounce pointer-events-none flex items-center gap-1 bg-amber-500 text-zinc-950 font-black text-sm px-3 py-1.5 rounded-full shadow-2xl border border-amber-300"
              >
                <Coins className="w-4 h-4 fill-current" />
                <span>+{item.amount} TK!</span>
              </div>
            ))}

            {/* Lovense Toy Vibration Overlay */}
            {isLovenseVibrating && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-amber-500/90 text-zinc-950 backdrop-blur-md px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 animate-pulse shadow-2xl shadow-amber-500/50 border border-amber-300">
                <Zap className="w-6 h-6 animate-spin" />
                <span>¡LOVENSE VIBRANDO AL NIVEL MÁXIMO! ⚡</span>
              </div>
            )}

            {/* TOP STREAM OVERLAY BAR - Clean, minimal & transparent */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="bg-rose-600/90 backdrop-blur-md text-white font-extrabold text-[11px] uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  {isPrivateMode ? 'SHOW PRIVADO 1:1' : 'EN VIVO'}
                </span>

                <span className="bg-black/60 backdrop-blur-md text-zinc-200 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-rose-400" />
                  {model.viewersCount.toLocaleString()}
                </span>
              </div>

              {/* Private Mode Counter if active */}
              {isPrivateMode && (
                <div className="bg-amber-500 text-zinc-950 font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg pointer-events-auto">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Tiempo: {Math.floor(privateSeconds / 60)}m {privateSeconds % 60}s</span>
                </div>
              )}
            </div>

          </div>

          {/* CLEAN & UNOBSTRUCTED PLAYER CONTROLS & RELATED MODELS CAROUSEL (BELOW VIDEO) */}
          <div className="bg-zinc-950 border-t border-zinc-800/90 p-3 flex flex-col gap-2.5">
            
            {/* Related Models / Modelos Relacionadas Carousel - replaces old goal bar section */}
            {relatedModels.length > 0 && (
              <div className="bg-zinc-900/90 border border-zinc-800/80 px-3.5 py-2.5 rounded-2xl flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <Flame className="w-3.5 h-3.5 animate-pulse" />
                    <span>Transmisiones Relacionadas</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">Clic para cambiar de sala</span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
                  {relatedModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => triggerAd(m)}
                      className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800/80 p-1.5 rounded-xl shrink-0 transition text-left group cursor-pointer"
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-700 shrink-0">
                        <img
                          src={m.avatarUrl}
                          alt={m.displayName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-zinc-950 rounded-full" />
                      </div>
                      <div className="text-[10px] pr-1.5 max-w-[100px]">
                        <div className="font-bold text-zinc-200 group-hover:text-rose-400 truncate">{m.displayName}</div>
                        <div className="text-[9px] text-zinc-500 flex items-center gap-0.5 mt-0.5">
                          <Eye className="w-2.5 h-2.5 text-zinc-500" />
                          <span>{m.viewersCount.toLocaleString()}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Player Main Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/70 p-2 rounded-xl border border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                {/* HLS Live Status / Reload */}
                <button
                  onClick={() => {
                    setVideoError(false);
                    setStreamSource('video');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                    streamSource === 'video' && !videoError
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="Recargar transmisión HLS Live"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>HLS Live</span>
                </button>

                <button
                  onClick={() => {
                    setVideoError(false);
                    setStreamSource('video');
                  }}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                  title="Recargar señal HLS"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                {/* Mute/Unmute Button */}
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                    }
                    setIsMuted(!isMuted);
                  }}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition flex items-center gap-1 text-[11px] font-bold px-2.5"
                  title={isMuted ? 'Activar Sonido' : 'Silenciar'}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden sm:inline text-zinc-400">Sin Sonido</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="hidden sm:inline text-emerald-400">Audio HD</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition"
                  title="Pantalla Completa"
                >
                  <Maximize className="w-4 h-4 text-rose-400" />
                </button>

                {/* Quality Selector */}
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="bg-zinc-800 text-zinc-200 text-[11px] font-bold px-2 py-1 rounded-lg border border-zinc-700 outline-none hover:border-zinc-600 cursor-pointer text-center"
                  title="Seleccionar calidad de transmisión"
                >
                  <option value="auto">⚡ Auto ABR</option>
                  <option value="1080p">HD 1080p</option>
                  <option value="720p">720p / 480p</option>
                  <option value="240p">240p</option>
                </select>

                <a
                  href={model.chatUrl || `https://stripcash.com/live/${model.username}?aff=aff_velvet_101`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition text-[11px] font-bold flex items-center gap-1"
                  title="Abrir canal directo en Stripchat"
                >
                  <ExternalLink className="w-3 h-3 text-rose-400" />
                  <span className="hidden sm:inline">Stripchat</span>
                </a>

                {/* Private Show Button */}
                {!isPrivateMode ? (
                  <button
                    onClick={() => setShowPrivateModal(true)}
                    className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition shadow-md flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Pedir Privado ({model.tokensPerMin} TK/m)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPrivateMode(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-zinc-700"
                  >
                    Salir
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Model Quick Actions Under Video */}
          <div className="p-3 bg-zinc-900/80 flex items-center justify-between border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(model)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isFavorite
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
                <span>{isFavorite ? 'Favorita' : 'Añadir a Favoritos'}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('¡Enlace de transmisión copiado!');
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition border border-zinc-700 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
              <Coins className="w-4 h-4" />
              <span>Tu saldo: {userTokens} TK</span>
              <button onClick={onOpenBuyTokens} className="underline text-amber-300 hover:text-white ml-1">
                + Recargar
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Live Chat & Tip Menu */}
        <div className="lg:w-5/12 xl:w-1/3 flex flex-col bg-zinc-950 h-full">
          
          {/* Header Tabs */}
          <div className="flex items-center border-b border-zinc-800 bg-zinc-900/60 p-2 gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Live</span>
            </button>

            <button
              onClick={() => setActiveTab('tips')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'tips'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Menú Propinas</span>
            </button>

            <button
              onClick={() => setActiveTab('bio')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'bio'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Perfil</span>
            </button>
          </div>

          {/* TAB 1: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Messages Feed */}
              <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                
                {/* Channel Welcome Notice */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-400 space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Bienvenido a la sala oficial de @{model.username}</span>
                  </div>
                  <p>Sé respetuoso en el chat. ¡Envía propinas para activar el juguete Lovense y solicitar bailes o metas!</p>
                </div>

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col text-xs rounded-2xl p-2.5 transition ${
                      msg.isTip
                        ? 'bg-gradient-to-r from-amber-950/80 to-rose-950/80 border border-amber-500/50 text-amber-200'
                        : msg.isModel
                        ? 'bg-rose-950/60 border border-rose-800/60 text-white ml-2'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        {msg.isModel ? (
                          <span className="text-rose-400 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            {msg.sender} (MODELO)
                          </span>
                        ) : (
                          <span className="text-zinc-300">{msg.sender}</span>
                        )}

                        {msg.badge && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                              msg.badge === 'TOP_TIPPER'
                                ? 'bg-amber-500 text-zinc-950'
                                : msg.badge === 'VIP'
                                ? 'bg-purple-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {msg.badge}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                    </div>

                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Quick Preset Tip Buttons */}
              <div className="p-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0">Tip Rápido:</span>
                {[10, 25, 50, 100, 250].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleSendTip(amount)}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs shrink-0 flex items-center gap-1 transition"
                  >
                    <Coins className="w-3 h-3" />
                    <span>{amount} TK</span>
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje para la modelo..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-zinc-900 text-xs text-white placeholder-zinc-500 px-3.5 py-2.5 rounded-xl border border-zinc-800 focus:border-rose-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: TIP MENU */}
          {activeTab === 'tips' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-400" /> Menú de Propinas Interactivas
              </div>

              {model.tipMenu.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between hover:border-amber-500/50 transition group"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white group-hover:text-amber-300">{item.label}</div>
                    <div className="text-[11px] text-zinc-400">{item.description}</div>
                  </div>

                  <button
                    onClick={() => handleSendTip(item.tokens, item.label)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-950/30"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{item.tokens} TK</span>
                  </button>
                </div>
              ))}

              <div className="pt-2 text-center">
                <button
                  onClick={onOpenBuyTokens}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>¿Necesitas más tokens? Clic aquí para recargar</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MODEL BIO */}
          {activeTab === 'bio' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs text-zinc-300">
              
              {/* Bio summary */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                <span className="font-bold text-white text-sm block">Sobre {model.displayName}</span>
                <p className="leading-relaxed text-zinc-400">{model.bio}</p>
              </div>

              {/* Physical Specs */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                <span className="font-bold text-white text-xs uppercase tracking-wider block text-rose-400">
                  Detalles Físicos & Idiomas
                </span>
                <div className="grid grid-cols-2 gap-2 text-zinc-300">
                  <div><span className="text-zinc-500">Edad:</span> {model.age} años</div>
                  <div><span className="text-zinc-500">País:</span> {model.country}</div>
                  <div><span className="text-zinc-500">Etnia:</span> {model.ethnicity}</div>
                  <div><span className="text-zinc-500">Cuerpo:</span> {model.bodyType}</div>
                  <div><span className="text-zinc-500">Cabello:</span> {model.hairColor}</div>
                  <div><span className="text-zinc-500">Tarifa:</span> {model.tokensPerMin} TK/min</div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl space-y-1">
                <span className="font-bold text-white text-xs block text-amber-400">Horario de Transmisión</span>
                <p className="text-zinc-400">{model.schedule}</p>
              </div>

              {/* Gallery Preview */}
              {model.galleryImages.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-white text-xs block">Fotos de Galería</span>
                  <div className="grid grid-cols-3 gap-2">
                    {model.galleryImages.map((imgUrl, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                        <img src={imgUrl} alt="Gallery" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Infinite Horizontal Scroll Grid */}
      <div className="bg-zinc-950 p-4 sm:p-6 border-t border-zinc-900 shrink-0">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
           <Flame className="w-4 h-4 text-rose-500" /> Sigue Explorando Modelos
        </h3>
        
        {visibleModels.length > 0 ? (
          <div className="relative w-full">
            <div 
              className="grid gap-3 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar"
              style={{
                gridTemplateRows: "repeat(2, minmax(0, 1fr))",
                gridAutoFlow: "column",
                gridAutoColumns: "calc(50% - 0.375rem)"
              }}
            >
              {visibleModels.map((m) => (
                <div key={m.id} className="snap-start w-full h-full">
                  <CompactModelCard
                    model={m}
                    isFavorite={false}
                    onToggleFavorite={onToggleFavorite}
                    onSelectModel={triggerAd}
                  />
                </div>
              ))}
              
              {/* Infinite Scroll Sentinel (Horizontal) */}
              {visibleCount < gridModels.length && (
                <div 
                  ref={loadMoreRef} 
                  className="snap-start flex flex-col items-center justify-center h-full min-w-[120px] bg-zinc-900/40 rounded-xl border border-zinc-800/50" 
                  style={{ gridRow: "1 / span 2" }}
                >
                  <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mb-2"></div>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider text-center">Cargando<br/>Más...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">No hay más modelos disponibles por el momento.</p>
        )}
      </div>

      </div>
    </div>

      {/* PRIVATE SHOW MODAL CONFIRMATION */}
      {showPrivateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-white">Iniciar Show Privado 1 a 1</h3>
              <p className="text-xs text-zinc-400">
                Disfruta de una sesión exclusiva con <strong className="text-rose-400">@{model.username}</strong> sin otros espectadores.
              </p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Tarifa por minuto:</span>
                <strong className="text-amber-400">{model.tokensPerMin} TK / min</strong>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Tu saldo actual:</span>
                <strong className="text-white">{userTokens} TK</strong>
              </div>
            </div>

             <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPrivateModal(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center"
              >
                Cancelar
              </button>

              <button
                onClick={handleStartPrivate}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center justify-center"
              >
                Confirmar e Iniciar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
