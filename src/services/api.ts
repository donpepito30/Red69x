const CACHE_NAME = 'models-cache-v1';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithBackoff(url: string, retries = 3, baseDelay = 1000): Promise<Response> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        // Retry on rate limits or server errors
        throw new Error(`Server error ${response.status}`);
      }
      return response; // Return 4xx errors immediately without retry (except 429)
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s...
      console.warn(`[Network] Intento ${attempt} fallido. Reintentando en ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('All retries failed');
}

export async function fetchModels(paramsString: string = '') {
  const url = paramsString ? `/api/models?${paramsString}` : '/api/models';
  
  try {
    const response = await fetchWithBackoff(url);

    if (!response.ok) {
      // Fallback a Cache Storage local si la API falla con error (Ej. 500)
      const cached = await caches.match(url);
      if (cached) {
        console.warn("API falló. Sirviendo desde Cache API local en 0ms.");
        const data = await cached.json();
        return processModelsData(data);
      }

      let errData;
      try { errData = await response.json(); } catch { errData = await response.text(); }
      console.error('Error desde el servidor:', errData);
      return [];
    }

    // Guarda clon de la respuesta exitosa asíncronamente en el Cache Storage
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => {
      cache.put(url, clone);
    });

    const data = await response.json();
    return processModelsData(data);
    
  } catch (error) {
    console.error('Fallo de red al solicitar /api/models:', error);
    // Modo Offline estricto: intentamos recuperar de la caché local
    try {
      const cached = await caches.match(url);
      if (cached) {
        console.warn("Modo sin conexión. Sirviendo desde Cache API local en 0ms.");
        const data = await cached.json();
        return processModelsData(data);
      }
    } catch (cacheErr) {
      console.error("Error leyendo caché:", cacheErr);
    }
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
