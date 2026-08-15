export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const affiliateId = url.searchParams.get('aff') || url.searchParams.get('affiliate_id') || 'aff_velvet_101';
    
    const upstreamUrl = new URL('https://go.whitetrafsa.com/api/models');
    for (const [key, value] of url.searchParams.entries()) {
      upstreamUrl.searchParams.set(key, value);
    }
    if (!upstreamUrl.searchParams.has('aff')) {
      upstreamUrl.searchParams.set('aff', affiliateId);
    }
    if (!upstreamUrl.searchParams.has('limit')) {
      upstreamUrl.searchParams.set('limit', '300');
    }

    let rawFetchedModels = [];
    let apiSource = 'pending';
    let lastError = null;

    // INTENTO 1
    rawFetchedModels = await fetchUpstream(upstreamUrl, 1, affiliateId);
    if (rawFetchedModels.length > 0) {
      apiSource = 'cloudflare_upstream_api';
    } else {
      // INTENTO 2 (con backoff)
      await new Promise(r => setTimeout(r, 1000));
      rawFetchedModels = await fetchUpstream(upstreamUrl, 2, affiliateId);
      if (rawFetchedModels.length > 0) {
        apiSource = 'cloudflare_upstream_api_retry2';
      }
    }

    // Filtrar y procesar
    let filtered = await processModels(url, rawFetchedModels, affiliateId);

    // Si sigue fallando, usar fallback
    if (filtered.length === 0) {
      apiSource = 'cloudflare_fallback_catalog';
      filtered = getFallbackCatalog(affiliateId);
      console.warn('⚠️ Using fallback catalog - upstream API failed');
    }

    return new Response(JSON.stringify({
      status: 'success',
      code: 200,
      api_source: apiSource,
      total_models: filtered.length,
      warning: lastError ? `Failed to fetch real data: ${lastError}` : null,
      models: filtered,
      client_models: filtered
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchUpstream(url, attemptNumber, affiliateId) {
  try {
    console.log(`[Attempt ${attemptNumber}] Fetching from: ${url.toString()}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal,
      cf: { 
        cacheTtl: 30,
        cacheEverything: false,
        minify: { javascript: true }
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Attempt ${attemptNumber}] API returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : data.models || data.items || data.data || [];
    
    if (items && items.length > 0) {
      console.log(`[Attempt ${attemptNumber}] ✅ Got ${items.length} models from upstream`);
      return transformUpstreamModels(items, affiliateId);
    } else {
      console.warn(`[Attempt ${attemptNumber}] API returned empty array`);
      return [];
    }

  } catch (err) {
    console.error(`[Attempt ${attemptNumber}] Error: ${err.message}`);
    return [];
  }
}

function transformUpstreamModels(items, affiliateId) {
  return items.map((m) => ({
    id: String(m.id || m.username),
    username: m.username,
    displayName: m.displayName || m.username,
    age: m.age || 21,
    country: m.modelsCountry || m.country || 'US',
    countryCode: m.modelsCountry || m.countryCode || 'US',
    gender: m.gender === 'f' ? 'female' : m.gender === 'm' ? 'male' : m.gender === 'c' ? 'couple' : 'female',
    status: m.status === 'public' ? 'online' : m.status || 'online',
    avatarUrl: m.avatarUrl || m.avatar_url || `https://img.strpst.com/images/avatars/${m.username}.jpg`,
    snapshotUrl: m.snapshotUrl || m.snapshot_url || m.avatarUrl || `https://img.strpst.com/images/vthumbs/${m.username}.jpg`,
    videoUrl: m.stream?.url || m.streamUrl || m.video_url || '',
    streamUrls: m.stream?.urls || {},
    iframeEmbedUrl: `https://stripchat.com/embed/${m.username}?aff=${affiliateId}`,
    viewersCount: m.viewersCount || m.viewers_count || Math.floor(Math.random() * 3000) + 150,
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
    chatUrl: `https://stripcash.com/live/${m.username}?aff=${affiliateId}`,
    affiliateUrl: `https://stripcash.com/api/models/${m.username}?aff=${affiliateId}`
  }));
}

async function processModels(url, models, affiliateId) {
  let filtered = [...models];
  
  const genderParam = url.searchParams.get('gender') || url.searchParams.get('g');
  const tagsParam = url.searchParams.get('tags') || url.searchParams.get('category');
  const statusParam = url.searchParams.get('status');
  const queryParam = url.searchParams.get('search') || url.searchParams.get('q');
  const sortParam = url.searchParams.get('sort') || 'viewers';
  const isLovenseOnly = url.searchParams.get('isLovenseOnly') === 'true';
  const isHdOnly = url.searchParams.get('isHdOnly') === 'true';

  if (genderParam && genderParam !== 'all') {
    const genders = genderParam.toLowerCase().split(',');
    filtered = filtered.filter(m => genders.includes(m.gender.toLowerCase()));
  }

  if (statusParam && statusParam !== 'all') {
    filtered = filtered.filter(m => m.status === statusParam);
  }

  if (tagsParam) {
    const rawTags = tagsParam.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    filtered = filtered.filter(m => {
      return rawTags.some(t => {
        if (m.tags && m.tags.some(modelTag => modelTag.toLowerCase().includes(t))) return true;
        if (m.topic && m.topic.toLowerCase().includes(t)) return true;
        if (t === 'latina') return ['colombia', 'españa', 'méxico', 'argentina', 'perú', 'chile', 'latino'].some(c => (m.country && m.country.toLowerCase().includes(c)) || (m.ethnicity && m.ethnicity.toLowerCase().includes(c)));
        if (t === 'lovense') return m.isLovense;
        if (t === 'hd') return m.isHd;
        return false;
      });
    });
  }

  if (queryParam) {
    const q = queryParam.toLowerCase();
    filtered = filtered.filter(m => m.username.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q));
  }

  if (isLovenseOnly) filtered = filtered.filter(m => m.isLovense);
  if (isHdOnly) filtered = filtered.filter(m => m.isHd);

  filtered.sort((a, b) => {
    if (sortParam === 'rating') return b.rating - a.rating;
    if (sortParam === 'tokens') return a.tokensPerMin - b.tokensPerMin;
    if (sortParam === 'rank') return a.rank - b.rank;
    return b.viewersCount - a.viewersCount;
  });

  return filtered;
}

function getFallbackCatalog(affiliateId) {
  return [
    {
      id: 'm1',
      username: 'sophia_latina',
      displayName: 'Sophia Latina',
      age: 22,
      country: 'Colombia',
      countryCode: 'CO',
      gender: 'female',
      status: 'online',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      snapshotUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      iframeEmbedUrl: `https://stripchat.com/embed/sophia_latina?aff=${affiliateId}`,
      viewersCount: 2840,
      rating: 4.9,
      favoriteCount: 18400,
      rank: 1,
      topic: '🔥 [META DE HOY: 850/1000] Baile sensual en lencería | Toy Lovense Activo ⚡',
      tags: ['Latina', 'Petite', 'Lovense', 'HD 1080p', 'Bailarina'],
      languages: ['Español', 'Inglés'],
      ethnicity: 'Hispana/Latina',
      bodyType: 'Delgada',
      hairColor: 'Castaño',
      tokensPerMin: 60,
      isHd: true,
      isVr: false,
      isLovense: true,
      bio: 'Hola mis amores! Bienvenidos a mi transmisión.',
      schedule: '24/7 Live',
      galleryImages: [],
      tipMenu: [],
      chatUrl: `https://stripcash.com/live/sophia_latina?aff=${affiliateId}`,
      affiliateUrl: `https://stripcash.com/api/models/sophia_latina?aff=${affiliateId}`
    }
  ];
}
