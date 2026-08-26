const CACHE_KEY = 'redex_models_cache_v1';
const MEMORY_CACHE = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithBackoff(url: string, retries = 2, baseDelay = 300): Promise<Response> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout per attempt

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Server status ${response.status}`);
      }
      return response;
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      const delay = baseDelay * attempt;
      await sleep(delay);
    }
  }
  throw new Error('All retries failed');
}

export function getCachedModels(paramsString: string = '') {
  const cacheKey = paramsString || 'default';
  const mem = MEMORY_CACHE.get(cacheKey);
  if (mem && (Date.now() - mem.timestamp < CACHE_TTL_MS)) {
    return mem.data;
  }
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}_${cacheKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

export async function fetchModels(paramsString: string = '') {
  const cacheKey = paramsString || 'default';
  const url = paramsString ? `/api/models?${paramsString}` : '/api/models';
  
  try {
    const response = await fetchWithBackoff(url);

    if (!response.ok) {
      const fallback = getCachedModels(paramsString);
      if (fallback) return fallback;
      return [];
    }

    const data = await response.json();
    const processed = processModelsData(data);
    
    // Save to memory cache & session storage
    if (processed.length > 0) {
      MEMORY_CACHE.set(cacheKey, { data: processed, timestamp: Date.now() });
      try {
        sessionStorage.setItem(`${CACHE_KEY}_${cacheKey}`, JSON.stringify(processed.slice(0, 80)));
      } catch {}
    }

    return processed;
  } catch (error) {
    console.warn('Network error, attempting cached fallback:', error);
    const fallback = getCachedModels(paramsString);
    if (fallback) return fallback;
    return [];
  }
}

function processModelsData(data: any) {
  const rawModels = Array.isArray(data) ? data : (data.models || []);
  
  return rawModels.map((m: any) => ({
    id: String(m.id || m.username),
    username: m.username,
    displayName: m.name || m.displayName || m.username,
    age: m.age || 21,
    country: m.modelsCountry || m.country || 'US',
    countryCode: m.modelsCountry || m.countryCode || 'US',
    gender: m.gender === 'f' ? 'female' : m.gender === 'm' ? 'male' : m.gender === 'c' ? 'couple' : 'female',
    status: m.isLive ? 'online' : (m.status === 'public' ? 'online' : m.status || 'online'),
    avatarUrl: m.avatar || m.avatarUrl || m.avatar_url || `https://img.strpst.com/images/avatars/${m.username}.jpg`,
    snapshotUrl: m.thumbnail || m.snapshotUrl || m.snapshot_url || m.popularSnapshotUrl || `https://img.strpst.com/images/vthumbs/${m.username}.jpg`,
    videoUrl: m.stream?.url || m.streamUrl || m.video_url || '',
    streamUrls: m.stream?.urls || {},
    iframeEmbedUrl: m.embedUrl || `https://stripchat.com/embed/${m.username}`,
    viewersCount: m.viewers || m.viewersCount || m.viewers_count || 0,
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
    broadcastMobile: !!m.broadcastMobile,
    streamWidth: m.stream?.width || 0,
    streamHeight: m.stream?.height || 0,
    bio: m.bio || 'Welcome to my official live stream room!',
    schedule: m.schedule || '',
    galleryImages: m.images || [],
    tipMenu: [
      { id: '1', label: 'Flash', tokens: 10, description: 'Flash boobs', actionType: 'flash' },
      { id: '2', label: 'Lovense 10s', tokens: 25, description: 'Vibrate toy for 10s', actionType: 'lovense' },
      { id: '3', label: 'Dance', tokens: 50, description: 'Stand up and dance', actionType: 'dance' }
    ],
    chatUrl: m.affiliateUrl || `https://stripcash.com/live/${m.username}?aff=aff_velvet_101`,
    affiliateUrl: m.affiliateUrl || `https://stripcash.com/api/models/${m.username}?aff=aff_velvet_101`,
    embedUrl: m.embedUrl,
    avatar: m.avatar,
    thumbnail: m.thumbnail,
    name: m.name,
    isLive: m.isLive
  }));
}
