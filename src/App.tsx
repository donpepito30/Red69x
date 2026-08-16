

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
      if (filters.gender !== 'all') params.set('gender', filters.gender);
      if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
      if (filters.search) params.set('search', filters.search);
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.isLovenseOnly) params.set('isLovenseOnly', 'true');
      if (filters.isHdOnly) params.set('isHdOnly', 'true');
      if (filters.language !== 'all') params.set('language', filters.language);
      if (filters.ethnicity !== 'all') params.set('profileEthnicity', filters.ethnicity);
      if (filters.hairColor !== 'all') params.set('profileHairColor', filters.hairColor);
      if (filters.bodyType !== 'all') params.set('profileBodyType', filters.bodyType);
      params.set('sort', filters.sortBy);
      params.set('limit', '300');

      const res = await fetch(`/api/models?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch models: ${res.status}`);
      }
      
      const data = await res.json();
      const rawModels = Array.isArray(data) ? data : data.models || data.items || data.data || [];
      
      const mappedModels = rawModels.map((m: any) => ({
        id: String(m.id || m.username),
        username: m.username,
        displayName: m.displayName || m.username,
        age: m.age || 21,
        country: m.modelsCountry || m.country || 'US',
        countryCode: m.modelsCountry || m.countryCode || 'US',
        gender: m.gender === 'f' ? 'female' : m.gender === 'm' ? 'male' : m.gender === 'c' ? 'couple' : 'female',
        status: m.status === 'public' ? 'online' : m.status || 'online',
        avatarUrl: `https://img.strpst.com/images/avatars/${m.username}.jpg`,
        snapshotUrl: `https://img.strpst.com/images/vthumbs/${m.username}.jpg`,
        videoUrl: m.stream?.url || m.streamUrl || m.video_url || '',
        streamUrls: m.stream?.urls || {},
        iframeEmbedUrl: `https://stripchat.com/embed/${m.username}`,
        viewersCount: m.viewersCount || m.viewers_count || 0,
        rating: m.rating || 4.9,
        favoriteCount: m.favoritedCount || m.favorites || m.favorite_count || 120,
        rank: m.rank || 1,
        topic: m.topic || 'Live show! Come chat with me ❤️',
        tags: m.tags || [],
        languages: m.languages || ['English', 'Spanish'],
        ethnicity: m.ethnicity || 'Latina',
        bodyType: m.bodyType || m.body_type || 'Slim',
        hairColor: m.hairColor || m.hair_color || 'Brunette',
        tokensPerMin: m.tokensPerMin || m.price || 15,
        isHd: m.broadcastHD !== undefined ? m.broadcastHD : true,
        isVr: m.isVr || false,
        isLovense: (m.broadcastInteractiveToy && m.broadcastInteractiveToy.includes('lovense')) || m.isLovense || false,
        bio: m.bio || 'Welcome to my official live stream room!',
        schedule: m.schedule || '',
        galleryImages: m.images || [],
        tipMenu: [
          { id: '1', label: 'Flash', tokens: 10, description: 'Flash boobs', actionType: 'flash' },
          { id: '2', label: 'Lovense 10s', tokens: 25, description: 'Vibrate toy for 10s', actionType: 'lovense' },
          { id: '3', label: 'Dance', tokens: 50, description: 'Stand up and dance', actionType: 'dance' }
        ],
        chatUrl: `https://stripcash.com/live/${m.username}?aff=aff_velvet_101`,
        affiliateUrl: `https://stripcash.com/api/models/${m.username}?aff=aff_velvet_101`
      }));

      setModels(mappedModels);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Fallo explícito en la API de afiliados:', e);
      setModels([]); // Falla explícitamente vaciando la lista
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
        // Gender
        if (filters.gender !== 'all' && m.gender !== filters.gender) return false;

        // Tags & Category Pills Filtering
        if (filters.tags.length > 0) {
          const hasTag = filters.tags.some((t) => {
            const tagLower = t.toLowerCase();
            // Direct tag match in model tags
            if (m.tags.some((mTag) => mTag.toLowerCase().includes(tagLower))) return true;

            // Smart domain category matching
            if (tagLower === 'latina') {
              return (
                m.ethnicity.toLowerCase().includes('latin') ||
                ['colombia', 'mexico', 'venezuela', 'argentina', 'spain', 'brazil', 'chile', 'peru', 'latina'].some((c) =>
                  m.country.toLowerCase().includes(c)
                )
              );
            }
            if (tagLower === 'lovense') return m.isLovense;
            if (tagLower === 'hd 1080p' || tagLower === 'hd') return m.isHd;
            if (tagLower === 'vr cams' || tagLower === 'vr') return m.isVr;
            if (tagLower === 'pareja' || tagLower === 'parejas') return m.gender === 'couple';
            if (tagLower === 'milf') return m.age >= 30;
            if (tagLower === 'petite') return m.bodyType.toLowerCase().includes('petite') || m.tags.some((mTag) => mTag.toLowerCase().includes('small'));
            if (tagLower === 'tatuajes') return m.tags.some((mTag) => mTag.toLowerCase().includes('tattoo') || mTag.toLowerCase().includes('ink'));
            return false;
          });
          if (!hasTag) return false;
        }

        // Search Query
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchName = m.displayName.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
          const matchCountry = m.country.toLowerCase().includes(q);
          const matchTopic = m.topic.toLowerCase().includes(q);
          if (!matchName && !matchCountry && !matchTopic) return false;
        }

        // Special Toggles
        if (filters.isLovenseOnly && !m.isLovense) return false;
        if (filters.isHdOnly && !m.isHd) return false;

        // Language
        if (filters.language !== 'all') {
          if (!m.languages.includes(filters.language)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'rating') return b.rating - a.rating;
        if (filters.sortBy === 'rank') return a.rank - b.rank;
        if (filters.sortBy === 'tokens') return a.tokensPerMin - b.tokensPerMin;
        return b.viewersCount - a.viewersCount;
      });
  }, [models, filters]);

  // Dynamic random rotation state for compact grid & pagination
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [prevFilters, setPrevFilters] = useState<FilterState>(filters);
  const ITEMS_PER_PAGE = 24;

  if (filters !== prevFilters) {
    setPrevFilters(filters);
    setCurrentPage(1);
  }

  const handleShuffleCompact = useCallback(() => {
    setShuffleSeed((prev) => prev + 1);
    setCurrentPage(1); // Reset to page 1 on shuffle
  }, []);

  // Featured Top Section (3 Top Models - only on page 1)
  const featuredModels = useMemo(() => {
    if (currentPage > 1) return [];
    return filteredModels.slice(0, 3);
  }, [filteredModels, currentPage]);

  // Remaining models for Compact Balanced Grid with random rotation
  const remainingModels = useMemo(() => {
    const rest = currentPage === 1 ? filteredModels.slice(3) : filteredModels;
    if (shuffleSeed === 0) return rest;

    const array = [...rest];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.abs(Math.sin(i + shuffleSeed * 777)) * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }, [filteredModels, shuffleSeed, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredModels.length / ITEMS_PER_PAGE));

  const compactModelsToDisplay = useMemo(() => {
    // If page 1, we show 21 items in grid (since top 3 are featured). If page > 1, show ITEMS_PER_PAGE.
    const startIdx = currentPage === 1 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE - 3;
    const limit = currentPage === 1 ? 21 : ITEMS_PER_PAGE;
    return remainingModels.slice(startIdx, startIdx + limit);
  }, [remainingModels, currentPage]);

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
      {currentPage === 1 && featuredModels.length > 0 && (
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

                {/* Professional Pagination Bar */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 border-t border-zinc-900 text-xs">
                    <div className="text-zinc-400 font-medium">
                      Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong> (Total: {filteredModels.length} modelos)
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      <button
                        onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentPage === 1}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 font-bold transition text-zinc-300"
                      >
                        Primero
                      </button>

                      <button
                        onClick={() => { setCurrentPage((prev) => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentPage === 1}
                        className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 font-bold transition text-zinc-300"
                      >
                        Anterior
                      </button>

                      {/* Page number buttons */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                          if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`inline-flex items-center justify-center w-9 h-9 rounded-xl font-bold transition border ${
                              currentPage === pageNum
                                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950/50'
                                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => { setCurrentPage((prev) => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 font-bold transition text-zinc-300"
                      >
                        Siguiente
                      </button>

                      <button
                        onClick={() => { setCurrentPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 font-bold transition text-zinc-300"
                      >
                        Último
                      </button>
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

