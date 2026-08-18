

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchModels } from '@/services/api';
import { Model, FilterState } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { CategoryPills } from '@/components/CategoryPills';
import { ModelCard } from '@/components/ModelCard';
import { CompactModelCard } from '@/components/CompactModelCard';
import { ModelRoomModal } from '@/components/ModelRoomModal';
import { FilterDrawer } from '@/components/FilterDrawer';
import { TokenPurchaseModal } from '@/components/TokenPurchaseModal';
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
  ChevronDown
} from 'lucide-react';

export default function HomePage() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [userTokens, setUserTokens] = useState<number>(250);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const hasAutoSelectedRef = useRef(false);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isBuyTokensOpen, setIsBuyTokensOpen] = useState(false);

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
    if (!isSilent) setIsLoading(true);
    try {
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
      // Stripcash uses 'public' to denote models that are online and in free chat.
      params.set('status', 'public');

      if (mappedLovense) params.set('isLovenseOnly', 'true');
      if (mappedHd) params.set('isHdOnly', 'true');
      if (filters.language !== 'all') params.set('language', filters.language);
      if (mappedEthnicity !== 'all') params.set('profileEthnicity', mappedEthnicity);
      if (filters.hairColor !== 'all') params.set('profileHairColor', filters.hairColor);
      if (mappedBodyType !== 'all') params.set('profileBodyType', mappedBodyType);
      
      params.set('sort', filters.sortBy);
      params.set('limit', '300');

      const fetchedModels = await fetchModels(params.toString());
      setModels(fetchedModels);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Error fetching data in App:', e);
      setModels([]);
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
        void fetchLiveModels(true); // Silent update in background
      }
    }, 30000);

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

  // Auto-select a random live model upon landing
  useEffect(() => {
    if (isMounted && models.length > 0 && !hasAutoSelectedRef.current && !selectedModel) {
      hasAutoSelectedRef.current = true;
      const randomIndex = Math.floor(Math.random() * models.length);
      setSelectedModel(models[randomIndex]);
    }
  }, [models, isMounted, selectedModel]);

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
  const handleSelectModel = useCallback((m: Model) => setSelectedModel(m), []);
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
      />

      {/* Category Pills Bar */}
      <CategoryPills filters={filters} setFilters={setFilters} />

      {/* Section: Modelos Destacados (Vista Principal) - Replaces the old stats banner */}
      {featuredModels.length > 0 && (
        <section className="bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950 border-b border-zinc-900 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Modelos <span className="text-rose-500">Destacadas</span>
                </h2>
              </div>
              
              <button
                onClick={() => void fetchLiveModels(false)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-bold text-zinc-300 transition"
                title="Actualizar"
              >
                <RefreshCw className={`w-3 h-3 text-rose-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isFavorite={favorites.includes(model.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onSelectModel={handleSelectModel}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Results Counter & Active Filter Tags */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-900">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <span>Mostrando <strong className="text-white">{filteredModels.length}</strong> transmisiones activas</span>
            {filters.tags.length > 0 && (
              <span className="text-rose-400">({filters.tags.join(', ')})</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-semibold hidden sm:inline">Ordenar por:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-zinc-900 text-zinc-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-800 outline-none"
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
            <p className="text-xs text-zinc-400 font-bold">Conectando con la API de Stripcash en tiempo real...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          /* Empty State if no filters match */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <SearchX className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-white">No se encontraron modelos coincidente</h3>
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
                })
              }
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Restablecer Todos los Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 2. COMPACT BALANCED GRID WITH RANDOM ROTATION */}
            {remainingModels.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h2 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                        Explorar Cámaras En Vivo
                        <span className="text-zinc-400 font-normal text-xs lowercase">
                          ({compactModelsToDisplay.length} de {remainingModels.length})
                        </span>
                      </h2>
                      <p className="text-[11px] text-zinc-400">
                        Navegación rápida en alta definición y con respuesta interactiva
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Random Shuffle Button */}
                    <button
                      onClick={handleShuffleCompact}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-bold text-rose-300 transition hover:scale-105 active:scale-95 shadow"
                      title="Mezclar y rotar aleatoriamente la lista de cámaras"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Rotar Cámaras Aleatorias</span>
                    </button>
                  </div>
                </div>

                {/* Compact Balanced Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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
                  <div ref={loadMoreRef} className="col-span-full w-full h-24 flex items-center justify-center pt-8">
                    <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
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

      {/* Footer */}
      <footer className="mt-auto bg-zinc-950 border-t border-zinc-900 py-10 text-xs text-zinc-500">
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
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Política de Privacidad de redex69: Todos los pagos son totalmente discretos, seguros y encriptados bajo protocolo SSL.'); }} className="hover:text-white transition">
                Privacidad & Discreción
              </a>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Términos y Condiciones: Acceso exclusivo para adultos mayores de 18 años (18+).'); }} className="hover:text-white transition">
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

