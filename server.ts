import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { MOCK_MODELS } from './src/lib/mockModelsData.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = (() => {
  try {
    if (typeof __filename !== 'undefined') return __filename;
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return fileURLToPath(import.meta.url);
    }
  } catch (e) {}
  return '';
})();

const __dirname = (() => {
  try {
    if (typeof __dirname !== 'undefined' && __dirname) return __dirname;
    if (__filename) return path.dirname(__filename);
  } catch (e) {}
  return process.cwd();
})();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

const CACHE = new Map<string, { data: any[], timestamp: number }>();

// API: /api/models
app.get('/api/models', async (req, res) => {
    try {
      const affiliateId = req.query.aff || req.query.affiliate_id || 'aff_velvet_101';
      let rawFetchedModels: any[] = [];
      let apiSource = 'whitetrafsa_primary_api';

      // Parse incoming params
      const genderParam = req.query.gender || req.query.g;
      const tagsParam = req.query.tags || req.query.category;
      const statusParam = req.query.status;
      const queryParam = req.query.search || req.query.q;
      const sortParam = req.query.sort || 'viewers';
      const isLovenseOnlyParam = req.query.isLovenseOnly === 'true';
      const isHdOnlyParam = req.query.isHdOnly === 'true';
      const languageParam = req.query.language;
      const limitParam = parseInt((req.query.limit || req.query.per_page || '60').toString(), 10);
      const pageParam = parseInt((req.query.page || '1').toString(), 10);
      const offsetParam = parseInt((req.query.offset || '0').toString(), 10) || (pageParam - 1) * limitParam;

      // Upstream API query params
      const upstreamParams = new URLSearchParams();
      upstreamParams.set('aff', affiliateId.toString());
      const upstreamLimit = Math.max(limitParam, 300);
      upstreamParams.set('limit', Math.min(upstreamLimit, 1000).toString());

      let apiTags: string[] = [];

      // Gender mappings
      if (genderParam && genderParam !== 'all') {
        const genders = genderParam.toString().toLowerCase().split(',');
        if (genders.includes('female') || genders.includes('f')) apiTags.push('girls');
        if (genders.includes('male') || genders.includes('m')) apiTags.push('men');
        if (genders.includes('trans') || genders.includes('t')) apiTags.push('trans');
        if (genders.includes('couple') || genders.includes('c')) apiTags.push('couples');
      }

      if (tagsParam) {
        const rawTags = tagsParam.toString().toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
        if (rawTags.includes('new')) upstreamParams.set('isNew', '1');
        if (rawTags.includes('anal')) upstreamParams.set('isMlAnal', '1');
        if (rawTags.includes('blowjob')) upstreamParams.set('isMlBlowjob', '1');
        if (rawTags.includes('vr cams') || rawTags.includes('vr')) upstreamParams.set('broadcastVR', '1');

        const translationMap: Record<string, string> = {
          'tatuajes': 'tattoo',
          'pareja': 'couples',
          'asiática': 'asian',
          'rubia': 'blonde',
          'morena': 'brunette',
          'madura': 'milf',
          'latina': 'ethnicityLatino',
          'lovense toy': 'lovense',
          'lovense': 'lovense'
        };

        const excludedTags = ['new', 'anal', 'blowjob', 'hd', 'hd 1080p', 'vr', 'vr cams', 'pareja'];
        const validTags = rawTags.filter(t => !excludedTags.includes(t)).map(t => translationMap[t] || t);
        if (rawTags.includes('pareja')) apiTags.push('couple');
        apiTags.push(...validTags);
      }

      if (apiTags.length > 0) {
        upstreamParams.set('tag', apiTags.join(','));
      }

      if (isHdOnlyParam) {
        upstreamParams.set('broadcastHD', '1');
      }

      if (req.query.profileInterestedIn) upstreamParams.set('profileInterestedIn', String(req.query.profileInterestedIn));
      if (req.query.profileBodyType) upstreamParams.set('profileBodyType', String(req.query.profileBodyType));
      if (req.query.profileEthnicity) upstreamParams.set('profileEthnicity', String(req.query.profileEthnicity));
      if (req.query.profileHairColor) upstreamParams.set('profileHairColor', String(req.query.profileHairColor));
      if (req.query.broadcastMobile === '1') upstreamParams.set('broadcastMobile', '1');

      if (queryParam) {
        upstreamParams.set('modelsList', queryParam.toString().replace(/\s+/g, ''));
      }

      const cacheKey = upstreamParams.toString();
      const cached = CACHE.get(cacheKey);

      if (cached && (Date.now() - cached.timestamp < 30000)) {
        rawFetchedModels = cached.data;
        apiSource = 'cached_upstream_api';
      } else {
        try {
          const fetchUrl = `https://go.whitetrafsa.com/api/models?${cacheKey}`;
          console.log('Connecting to real upstream API:', fetchUrl);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(fetchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const items = Array.isArray(data) ? data : data.models || data.items || data.data || [];
            if (items && items.length > 0) {
              console.log(`Successfully fetched ${items.length} models from upstream API.`);
              rawFetchedModels = items.map((m: any) => ({
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
              CACHE.set(cacheKey, { data: rawFetchedModels, timestamp: Date.now() });
            } else {
              console.warn('Upstream API returned empty array/items.');
            }
          } else {
            console.warn(`Upstream API error status: ${response.status} ${response.statusText}`);
          }
        } catch (upstreamErr) {
          console.warn('Real upstream API connection notice (falling back to robust catalog):', upstreamErr);
        }
      }

      if (rawFetchedModels.length === 0) {
        apiSource = 'local_fallback_catalog';
        rawFetchedModels = [...MOCK_MODELS];
      }

      let filtered = [...rawFetchedModels];

      if (genderParam && genderParam !== 'all') {
        const genders = genderParam.toString().toLowerCase().split(',');
        filtered = filtered.filter((m) => genders.includes(m.gender.toLowerCase()));
      }

      if (statusParam && statusParam !== 'all') {
        filtered = filtered.filter((m) => m.status === statusParam);
      }

      if (tagsParam) {
        const rawTags = tagsParam.toString().toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
        filtered = filtered.filter((m) => {
          return rawTags.some((t) => {
            if (m.tags && m.tags.some((modelTag: string) => modelTag.toLowerCase().includes(t))) return true;
            if (m.topic && m.topic.toLowerCase().includes(t)) return true;
            if (m.bio && m.bio.toLowerCase().includes(t)) return true;
            if (t === 'latina') return ['colombia', 'españa', 'méxico', 'argentina', 'perú', 'chile', 'latino'].some((c) => (m.country && m.country.toLowerCase().includes(c)) || (m.ethnicity && m.ethnicity.toLowerCase().includes(c)));
            if (t === 'lovense' || t === 'lovense toy') return m.isLovense;
            if (t === 'hd 1080p' || t === 'hd') return m.isHd;
            if (t === 'vr cams' || t === 'vr') return m.isVr;
            return false;
          });
        });
      }

      if (queryParam) {
        const q = queryParam.toString().toLowerCase();
        filtered = filtered.filter((m) => 
          (m.username && m.username.toLowerCase().includes(q)) || 
          (m.displayName && m.displayName.toLowerCase().includes(q)) || 
          (m.topic && m.topic.toLowerCase().includes(q))
        );
      }

      if (isLovenseOnlyParam) {
        filtered = filtered.filter((m) => m.isLovense);
      }
      if (isHdOnlyParam) {
        filtered = filtered.filter((m) => m.isHd);
      }
      if (languageParam && languageParam !== 'all') {
        filtered = filtered.filter((m) => m.languages && m.languages.some((l: string) => l.toLowerCase().includes(languageParam.toString().toLowerCase())));
      }

      filtered.sort((a, b) => {
        if (sortParam === 'rating') return b.rating - a.rating;
        if (sortParam === 'tokens') return a.tokensPerMin - b.tokensPerMin;
        if (sortParam === 'rank') return a.rank - b.rank;
        if (sortParam === 'age') return a.age - b.age;
        return b.viewersCount - a.viewersCount;
      });

      const totalCount = filtered.length;
      const paginated = filtered.slice(offsetParam, offsetParam + limitParam);

      res.json({
        status: 'success',
        code: 200,
        api_source: apiSource,
        total_models: totalCount,
        page: pageParam,
        per_page: limitParam,
        offset: offsetParam,
        timestamp: new Date().toISOString(),
        models: paginated,
        client_models: paginated
      });
    } catch (error) {
      console.error('Error in /api/models:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  // API: /api/gemini/chat
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { prompt, modelUsername } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ text: 'Respuesta generada (Simulación): ¡Hola! Gracias por tu mensaje en el chat.' });
      }
      const ai = new GoogleGenAI({ apiKey });
      
      let modelObj = MOCK_MODELS.find((m) => m.username === modelUsername);
      let systemInstruction = `Eres un asistente amable para un sitio de transmisión en vivo.`;
      
      if (modelObj) {
        systemInstruction = `Estás interpretando a la modelo de transmisión en vivo "${modelObj.displayName}". Tu personalidad es muy coqueta, cariñosa y amigable. Responde de manera breve y entusiasta (máximo 2 frases) al mensaje del usuario en el chat live. Idioma: Español.`;
      } else if (modelUsername) {
        systemInstruction = `Estás interpretando a la modelo de transmisión en vivo con username "${modelUsername}". Tu personalidad es muy coqueta, cariñosa y amigable. Responde de manera breve y entusiasta (máximo 2 frases) al mensaje del usuario en el chat live. Idioma: Español.`;
      }
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.8,
          maxOutputTokens: 150,
        },
      });
      res.json({ text: response.text || '¡Gracias por estar en la transmisión!' });
    } catch (error) {
      console.error('Error in Gemini Chat API:', error);
      res.json({ text: '¡Hola amor! Gracias por tu mensaje. ¡Disfruta el show en vivo!' });
    }
  });

  // Vite middleware setup
async function setupViteAndListen() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const baseDir = (__dirname && typeof __dirname === 'string') ? __dirname : process.cwd();
    const distPath = path.join(baseDir, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath);
    });
  }

  if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL === 'true') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupViteAndListen();

export default app;
