import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
// MOCK_MODELS import removed

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

const CACHE = new Map<string, { data: any[], timestamp: number }>();

// API: /api/models
app.get('/api/models', async (req, res) => {
  try {
    const targetUrl = new URL('https://go.whitetrafsa.com/api/models');
    // Forward all query parameters
    for (const key in req.query) {
      targetUrl.searchParams.append(key, req.query[key] as string);
    }
    // Ensure limit is sufficient for frontend pagination if not specified
    if (!targetUrl.searchParams.has('limit')) {
      targetUrl.searchParams.set('limit', '300');
    }

    const apiRes = await fetch(targetUrl.toString(), {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!apiRes.ok) {
      throw new Error(`Error API Afiliados: ${apiRes.status}`);
    }

    const rawData = await apiRes.json();

    // Extraer la lista (soporta si la API responde como array directo [...] o como objeto { models: [...] })
    const modelsList = Array.isArray(rawData) ? rawData : (rawData.models || rawData.data || []);

    // Mapear los nombres de campos para garantizar compatibilidad total con el Frontend
    const formattedModels = modelsList.map((m: any) => ({
      ...m,
      id: m.id || m.username,
      username: m.username,
      name: m.username,
      isLive: m.status === 'public' || m.isLive || true,
      avatar: m.avatarUrl || `https://img.strpst.com/images/avatars/${m.username}.jpg`,
      thumbnail: m.previewUrl || m.popularSnapshotUrl || `https://img.strpst.com/images/vthumbs/${m.username}.jpg`,
      embedUrl: `https://stripchat.com/embed/${m.username}`,
      affiliateUrl: `https://stripcash.com/live/${m.username}?aff=aff_velvet_101`,
      viewers: m.viewersCount || m.viewers || 0,
      tags: m.tags || []
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.json(formattedModels);
  } catch (error) {
    console.error('Error al mapear la API:', error);
    // Retornar error JSON explicativo
    return res.status(500).json({ 
      error: 'Error al procesar la API de afiliados', 
      details: String(error) 
    });
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
      
      let systemInstruction = `Eres un asistente amable para un sitio de transmisión en vivo.`;
      
      if (modelUsername) {
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
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupViteAndListen();

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/models') {
      try {
        const targetUrl = new URL('https://go.whitetrafsa.com/api/models');
        url.searchParams.forEach((value, key) => {
          targetUrl.searchParams.append(key, value);
        });
        
        // Ensure limit is sufficient for frontend pagination if not specified
        if (!targetUrl.searchParams.has('limit')) {
          targetUrl.searchParams.set('limit', '300');
        }

        const apiRes = await fetch(targetUrl.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
          }
        });

        if (!apiRes.ok) {
          const errorText = await apiRes.text();
          return new Response(JSON.stringify({
            error: `API Afiliados bloqueó o falló con status ${apiRes.status}`,
            responseSnippet: errorText.slice(0, 300)
          }), {
            status: apiRes.status,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const rawData: any = await apiRes.json();
        const modelsList = Array.isArray(rawData) ? rawData : (rawData.models || rawData.data || []);

        const formattedModels = modelsList.map((m: any) => ({
          ...m,
          id: m.id || m.username,
          username: m.username,
          name: m.username,
          isLive: m.status === 'public' || m.isLive || true,
          avatar: m.avatarUrl || `https://img.strpst.com/images/avatars/${m.username}.jpg`,
          thumbnail: m.previewUrl || m.popularSnapshotUrl || `https://img.strpst.com/images/vthumbs/${m.username}.jpg`,
          embedUrl: `https://stripchat.com/embed/${m.username}`,
          affiliateUrl: `https://stripcash.com/live/${m.username}?aff=aff_velvet_101`,
          viewers: m.viewersCount || m.viewers || 0,
          tags: m.tags || []
        }));

        return new Response(JSON.stringify(formattedModels), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: 'Excepción en Cloudflare Worker', details: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    // Si la petición no es de API, delegarla a los assets estáticos de Cloudflare
    if (!url.pathname.startsWith('/api')) {
      return env.ASSETS.fetch(request);
    }

    // Manejo de la petición de API dentro del runtime de Workers
    return new Promise((resolve) => {
      app(request as any, {
        end: (data: any) => resolve(new Response(data)),
        setHeader: () => {},
        writeHead: () => {},
        status: () => ({ send: (data: any) => resolve(new Response(data)) }),
        send: (data: any) => resolve(new Response(typeof data === 'string' ? data : JSON.stringify(data))),
        json: (data: any) => resolve(new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }))
      } as any);
    });
  }
};
