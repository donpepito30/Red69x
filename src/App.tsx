

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchModels, getCachedModels } from '@/services/api';
import { Model, FilterState } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { CategoryPills } from '@/components/CategoryPills';
import { ModelCard } from '@/components/ModelCard';
import { CompactModelCard } from '@/components/CompactModelCard';
import { ModelRoomModal } from '@/components/ModelRoomModal';
import { FilterDrawer } from '@/components/FilterDrawer';
import { TokenPurchaseModal } from '@/components/TokenPurchaseModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAd } from '@/context/AdContext';
import {
  Flame,
  Radio,
  Eye,
  Zap,
  ShieldCheck,
  Code2,
  SearchX,
  Lock,
  Heart,
  HelpCircle,
  Coins,
  RefreshCw,
  Globe,
  Loader2,
  Shuffle,
  ChevronDown,
  X
} from 'lucide-react';

export default function HomePage() {
  const { isBlurred, isTimeExpired, triggerAd } = useAd();
  const [models, setModels] = useState<Model[]>(() => {
    return getCachedModels('') || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => models.length === 0);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [userTokens, setUserTokens] = useState<number>(250);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Si el tiempo libre de 2 minutos expira, cerrar inmediatamente la sala de reproducción
  useEffect(() => {
    if (isTimeExpired) {
      setSelectedModel(null);
    }
  }, [isTimeExpired]);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isBuyTokensOpen, setIsBuyTokensOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isFavoritesSheetOpen, setIsFavoritesSheetOpen] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    gender: 'all',
    tags: [],
    search: '',
    minAge: 18,
    maxAge: 60,
    status: 'online',
    sortBy: 'viewers',
    isLovenseOnly: false,
    isHdOnly: false,
    language: 'all',
    ethnicity: 'all',
    hairColor: 'all',
    bodyType: 'all',
  });

  // Fetch real live models from API route
  const fetchLiveModels = useCallback(async (isSilent = false) => {
    const params = new URLSearchParams();
    
    let backendTags: string[] = [];
    let mappedGender = filters.gender;
    let mappedLovense = filters.isLovenseOnly;
    let mappedHd = filters.isHdOnly;
    let mappedEthnicity = filters.ethnicity;
    let mappedBodyType = filters.bodyType;

    // Smart mapping from frontend custom tags to Stripcash backend parameters
    filters.tags.forEach((tag) => {
      const lowerTag = tag.toLowerCase();
      if (lowerTag === 'latina') {
         mappedEthnicity = 'ethnicityLatino';
      } else if (lowerTag === 'lovense') {
         mappedLovense = true;
      } else if (lowerTag === 'hd 1080p' || lowerTag === 'hd') {
         mappedHd = true;
      } else if (lowerTag === 'pareja' || lowerTag === 'parejas') {
         mappedGender = 'couple';
      } else if (lowerTag === 'milf') {
         backendTags.push('milf');
      } else if (lowerTag === 'petite') {
         mappedBodyType = 'bodyTypePetite';
      } else if (lowerTag === 'vr cams' || lowerTag === 'vr') {
         backendTags.push('vr');
      } else if (lowerTag === 'tatuajes') {
         backendTags.push('tattoo');
      } else if (lowerTag === 'cosplay') {
         backendTags.push('cosplay');
      } else {
         backendTags.push(tag);
      }
    });

    if (mappedGender !== 'all') params.set('gender', mappedGender);
    if (backendTags.length > 0) params.set('tags', backendTags.join(','));
    if (filters.search) params.set('search', filters.search);
    
    // Strict rule: DO NOT show offline models or models in private shows.
    params.set('status', 'public');

    if (mappedLovense) params.set('isLovenseOnly', 'true');
    if (mappedHd) params.set('isHdOnly', 'true');
    if (filters.language !== 'all') params.set('language', filters.language);
    if (mappedEthnicity !== 'all') params.set('profileEthnicity', mappedEthnicity);
    if (filters.hairColor !== 'all') params.set('profileHairColor', filters.hairColor);
    if (mappedBodyType !== 'all') params.set('profileBodyType', mappedBodyType);
    
    params.set('sort', filters.sortBy);
    params.set('limit', '120');

    const paramsKey = params.toString();
    const cached = getCachedModels(paramsKey);
    if (cached && cached.length > 0) {
      setModels(cached);
      setIsLoading(false);
    } else if (!isSilent) {
      setIsLoading(true);
    }

    try {
      const fetchedModels = await fetchModels(paramsKey);
      if (fetchedModels && fetchedModels.length > 0) {
        setModels(fetchedModels);
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Error fetching data in App:', e);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [filters]);

  // Initial load on filter change + background 30s periodic auto refresh
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (active) {
        await fetchLiveModels(false);
      }
    };
    void loadData();

    const timer = setInterval(() => {
      if (active) {
        void fetchLiveModels(true); // Silent background update
      }
    }, 45000); // 45s interval to save CPU/battery

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [fetchLiveModels]);

  // Restore state from localStorage on client mount (prevents SSR hydration mismatch)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedTokens = localStorage.getItem('velvet_user_tokens');
        if (savedTokens) {
          const parsed = parseInt(savedTokens, 10);
          if (!isNaN(parsed)) setUserTokens(parsed);
        }
        const savedFavs = localStorage.getItem('velvet_favorite_ids');
        if (savedFavs) {
          const parsedFavs = JSON.parse(savedFavs);
          if (Array.isArray(parsedFavs)) setFavorites(parsedFavs);
        }
      } catch (e) {
        console.error('Failed to load saved state from localStorage:', e);
      }
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save tokens to localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('velvet_user_tokens', userTokens.toString());
    } catch (e) {
      console.error(e);
    }
  }, [userTokens, isMounted]);

  // Save favorites to localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('velvet_favorite_ids', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites, isMounted]);

  // Toggle favorite memoized
  const handleToggleFavorite = useCallback((e: React.MouseEvent | null, model: Model) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.includes(model.id);
      if (exists) return prev.filter((id) => id !== model.id);
      return [...prev, model.id];
    });
  }, []);

  // Memoized handlers for modals and drawers
  const handleSelectModel = useCallback(
    (m: Model) => {
      if (isTimeExpired) {
        window.location.replace("https://go.whitetrafsa.com?userId=a703e07cc602c7aecb72a257e7ece3fff9655e7eab57b09d95e4be998475cce2");
        return;
      }
      setSelectedModel(m);
    },
    [isTimeExpired]
  );
  const handleOpenBuyTokens = useCallback(() => setIsBuyTokensOpen(true), []);
  const handleToggleFilterDrawer = useCallback(() => setIsFilterDrawerOpen((prev) => !prev), []);

  // Filtered and Sorted Models List
  const filteredModels = useMemo(() => {
    return models
      .filter((m) => {
        // Search Query (Búsqueda de texto manual por el usuario)
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchName = (m.displayName || '').toLowerCase().includes(q) || (m.username || '').toLowerCase().includes(q);
          const matchCountry = (m.country || '').toLowerCase().includes(q);
          const matchTopic = (m.topic || '').toLowerCase().includes(q);
          if (!matchName && !matchCountry && !matchTopic) return false;
        }

        // Ya NO filtramos manualmente por 'tags', 'gender', 'lovense', 'hd', 'ethnicity', etc.
        // ¿Por qué? Porque el Backend (server.ts / Stripcash API) YA HIZO ESE TRABAJO.
        // Si el usuario tocó "Latina", la API SOLO devolvió modelos latinas.
        // Dejar que pasen directamente evita conflictos, crashes por "undefined" y pantallas en blanco.
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'rating') return b.rating - a.rating;
        if (filters.sortBy === 'rank') return a.rank - b.rank;
        if (filters.sortBy === 'tokens') return a.tokensPerMin - b.tokensPerMin;
        return (b.viewersCount || 0) - (a.viewersCount || 0);
      });
  }, [models, filters]);

  // Dynamic random rotation state for compact grid & pagination
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [prevFilters, setPrevFilters] = useState<FilterState>(filters);
  const ITEMS_PER_PAGE = 24;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  if (filters !== prevFilters) {
    setPrevFilters(filters);
    setVisibleCount(ITEMS_PER_PAGE);
  }

  const handleShuffleCompact = useCallback(() => {
    setShuffleSeed((prev) => prev + 1);
    setVisibleCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Featured Top Section (3 Top Models)
  const featuredModels = useMemo(() => {
    return filteredModels.slice(0, 3);
  }, [filteredModels]);

  // Remaining models for Compact Balanced Grid with random rotation
  const remainingModels = useMemo(() => {
    const rest = filteredModels.slice(3);
    if (shuffleSeed === 0) return rest;
    const array = [...rest];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.abs(Math.sin(i + shuffleSeed * 777)) * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }, [filteredModels, shuffleSeed]);

  const compactModelsToDisplay = useMemo(() => {
    return remainingModels.slice(0, Math.max(0, visibleCount - 3));
  }, [remainingModels, visibleCount]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredModels.length));
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );
    
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, [filteredModels.length, isLoading]);

  const favoriteModelObjects = useMemo(() => {
    return models.filter((m) => favorites.includes(m.id));
  }, [models, favorites]);

  const totalViewers = useMemo(() => {
    return models.reduce((acc, curr) => acc + curr.viewersCount, 0);
  }, [models]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      


      {/* Main Navigation Header */}
      <Navbar
        filters={filters}
        setFilters={setFilters}
        userTokens={userTokens}
        onOpenBuyTokens={handleOpenBuyTokens}
        onToggleFilterDrawer={handleToggleFilterDrawer}
        favoriteModels={favoriteModelObjects}
        onSelectModel={handleSelectModel}
        isMobileSearchOpen={isMobileSearchOpen}
        setIsMobileSearchOpen={setIsMobileSearchOpen}
      />

      {/* Category Pills Bar */}
      <CategoryPills filters={filters} setFilters={setFilters} />

      {/* Section: Modelos Destacados (Vista Principal) */}
      {featuredModels.length > 0 && (
        <section className="bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950 border-b border-zinc-900 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Modelos <span className="text-rose-500">Destacadas</span>
                </h2>
              </div>
              
              <button
                onClick={() => void fetchLiveModels(false)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-bold text-zinc-300 active:scale-95 transition"
                title="Actualizar"
              >
                <RefreshCw className={`w-3 h-3 text-rose-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Responsive grid / mobile horizontal snap carousel */}
            <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-3 sm:gap-6 pb-2 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
              {featuredModels.map((model) => (
                <div key={model.id} className="min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-center shrink-0 md:shrink">
                  <ModelCard
                    model={model}
                    isFavorite={favorites.includes(model.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectModel={handleSelectModel}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full pb-24 md:pb-8">
        
        {/* Results Counter & Active Filter Tags */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 pb-2 border-b border-zinc-900">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <span>Mostrando <strong className="text-white">{filteredModels.length}</strong> transmisiones</span>
            {filters.tags.length > 0 && (
              <span className="text-rose-400 hidden xs:inline">({filters.tags.join(', ')})</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-semibold hidden sm:inline">Ordenar por:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-zinc-900 text-zinc-200 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-zinc-800 outline-none"
            >
              <option value="viewers">Más Populares</option>
              <option value="rank">Ranking Top</option>
              <option value="rating">Mejor Calificación</option>
              <option value="tokens">Menor Precio TK</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner Skeleton state */}
        {isLoading && models.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-bold">Conectando con la API en tiempo real...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          /* Empty State if no filters match */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <SearchX className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-white">No se encontraron modelos coincidentes</h3>
              <p className="text-xs text-zinc-400">
                Prueba cambiando los criterios de búsqueda o limpiando las etiquetas seleccionadas.
              </p>
            </div>
            <button
              onClick={() =>
                setFilters({
                  gender: 'all',
                  tags: [],
                  search: '',
                  minAge: 18,
                  maxAge: 60,
                  status: 'online',
                  sortBy: 'viewers',
                  isLovenseOnly: false,
                  isHdOnly: false,
                  language: 'all',
                  ethnicity: 'all',
                  hairColor: 'all',
                  bodyType: 'all',
                })
              }
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs active:scale-95 transition"
            >
              Restablecer Todos los Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            {/* 2. COMPACT BALANCED GRID WITH RANDOM ROTATION */}
            {remainingModels.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                        Explorar Cámaras En Vivo
                        <span className="text-zinc-400 font-normal text-xs lowercase">
                          ({compactModelsToDisplay.length} de {remainingModels.length})
                        </span>
                      </h2>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Navegación ultra rápida en alta definición y con respuesta táctil
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Random Shuffle Button */}
                    <button
                      onClick={handleShuffleCompact}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-bold text-rose-300 transition active:scale-95 shadow"
                      title="Mezclar y rotar aleatoriamente la lista de cámaras"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden xs:inline">Rotar Aleatorias</span>
                      <span className="xs:hidden">Rotar</span>
                    </button>
                  </div>
                </div>

                {/* Compact Balanced Grid - 2 columns on mobile, up to 6 on desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
                  {compactModelsToDisplay.map((model) => (
                    <CompactModelCard
                      key={model.id}
                      model={model}
                      isFavorite={favorites.includes(model.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectModel={handleSelectModel}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Sentinel */}
                {visibleCount < filteredModels.length && (
                  <div ref={loadMoreRef} className="col-span-full w-full h-20 flex items-center justify-center pt-6">
                    <div className="flex items-center gap-2 text-zinc-500 font-medium text-xs sm:text-sm">
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin"></div>
                      Cargando más cámaras...
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

      </main>

      {/* Model Room Stream Overlay Modal */}
      {selectedModel && (
        <ModelRoomModal
          key={selectedModel.id}
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
          userTokens={userTokens}
          setUserTokens={setUserTokens}
          onOpenBuyTokens={() => setIsBuyTokensOpen(true)}
          isFavorite={favorites.includes(selectedModel.id)}
          onToggleFavorite={(m) => handleToggleFavorite(null, m)}
          models={models}
          onSelectModel={handleSelectModel}
        />
      )}

      {/* Advanced Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        totalResults={filteredModels.length}
      />

      {/* Token Purchase Modal */}
      <TokenPurchaseModal
        isOpen={isBuyTokensOpen}
        onClose={() => setIsBuyTokensOpen(false)}
        setUserTokens={setUserTokens}
      />

      {/* Mobile Favorites Bottom Sheet */}
      {isFavoritesSheetOpen && (
        <div 
          onClick={() => setIsFavoritesSheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-5 max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe"
          >
            {/* Grab handle affordance */}
            <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4 shrink-0" />
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="font-extrabold text-base text-white">Modelos Favoritas ({favoriteModelObjects.length})</h3>
              </div>
              <button 
                onClick={() => setIsFavoritesSheetOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {favoriteModelObjects.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Heart className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No tienes modelos guardadas</p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Toca el icono del corazón en cualquier tarjeta para tener acceso directo a tus transmisiones preferidas.
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1">
                {favoriteModelObjects.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      handleSelectModel(m);
                      setIsFavoritesSheetOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 active:bg-zinc-800/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-rose-500/60">
                        <img src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                      </div>
                      <div className="text-left">
                        <div className="font-extrabold text-sm text-white truncate max-w-[160px]">
                          {m.displayName}
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span>{m.country}</span>
                          <span>•</span>
                          <span className="text-rose-400 font-semibold">{m.viewersCount} viewers</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(e, m)}
                      className="p-2 text-rose-500 active:scale-90 transition"
                    >
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        filters={filters}
        onOpenFilters={() => setIsFilterDrawerOpen(true)}
        onOpenSearch={() => {
          setIsMobileSearchOpen((prev) => !prev);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFavorites={() => setIsFavoritesSheetOpen(true)}
        onOpenBuyTokens={() => setIsBuyTokensOpen(true)}
        userTokens={userTokens}
        favoriteModels={favoriteModelObjects}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Footer */}
      <footer className="mt-auto bg-zinc-950 border-t border-zinc-900 py-10 pb-28 md:pb-10 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-zinc-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center font-black text-white text-xs shadow-md">
                R69
              </div>
              <span className="font-black text-white text-sm tracking-wider">redex<span className="text-rose-500">69</span></span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-zinc-400">
              <button onClick={() => setIsBuyTokensOpen(true)} className="hover:text-amber-400 transition">
                Comprar Tokens
              </button>
              <button onClick={handleToggleFilterDrawer} className="hover:text-rose-400 transition">
                Filtros Avanzados
              </button>
              <a href="#privacy" className="hover:text-white transition">
                Privacidad & Discreción
              </a>
              <a href="#terms" className="hover:text-white transition">
                Términos 18+
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600">
            <p>© 2026 redex69. Todos los derechos reservados. Plataforma profesional de transmisiones en vivo en alta definición.</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-500">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
              </span>
              <span>•</span>
              <span>Cumplimiento RTA / 18 U.S.C. 2257</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

