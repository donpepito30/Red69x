import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
// MOCK_MODELS import removed

dotenv.config();

const app = express();
const PORT = 3000;

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

    const cacheKey = targetUrl.toString();
    const cached = CACHE.get(cacheKey);
    const now = Date.now();
    // 60 seconds cache
    if (cached && (now - cached.timestamp < 60000)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return res.json(cached.data);
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

    CACHE.set(cacheKey, { data: formattedModels, timestamp: now });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
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
    const vitePkg = 'vi' + 'te';
    const { createServer: createViteServer } = await import(/* @vite-ignore */ vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const pathPkg = 'pa' + 'th';
    const path = await import(/* @vite-ignore */ pathPkg);
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// SOLO ejecutar el listener local si estamos en un entorno Node.js real (no Cloudflare)
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  setupViteAndListen();
}

// Memoria caché simple en el código para Rate Limiting (sin requerir variables externas)
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // --- SEGURIDAD A NIVEL DE CÓDIGO (Sin variables de entorno) ---
    // Cambia '*' por tu dominio real si deseas restringirlo en el futuro (ej. 'https://midominio.com')
    const ALLOWED_ORIGIN = '*';

    // --- Validación de Origin y User-Agent ---
    const origin = request.headers.get('Origin') || '';
    const userAgent = request.headers.get('User-Agent') || '';

    // Bloquear peticiones sin User-Agent (bots básicos o scrapers malignos)
    if (!userAgent || userAgent.trim() === '') {
      return new Response(JSON.stringify({ error: 'User-Agent header is required' }), { 
        status: 400, headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Validación de CORS / Origin
    if (ALLOWED_ORIGIN !== '*' && origin && !origin.includes(ALLOWED_ORIGIN)) {
      return new Response(JSON.stringify({ error: 'Unauthorized Origin. Access Denied.' }), { 
        status: 403, headers: { 'Content-Type': 'application/json' } 
      });
    }

    // --- Rate Limiting Simple en Memoria (Nivel Código) ---
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
    if (clientIp !== 'unknown') {
      const now = Date.now();
      const limitRecord = rateLimitCache.get(clientIp);
      
      // Limpiar registros viejos (caducidad de 60 segundos)
      if (limitRecord && now > limitRecord.resetTime) {
        rateLimitCache.delete(clientIp);
      }
      
      const currentCount = rateLimitCache.get(clientIp)?.count || 0;
      
      // Limite de 150 peticiones por minuto por IP
      if (currentCount >= 150) {
        return new Response(JSON.stringify({ error: 'Too Many Requests. Rate limit exceeded.' }), { 
          status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } 
        });
      }
      
      // Incrementar contador
      rateLimitCache.set(clientIp, { 
        count: currentCount + 1, 
        resetTime: limitRecord && limitRecord.resetTime > now ? limitRecord.resetTime : now + 60000 
      });
    }

    if (url.pathname === '/api/models') {
      try {
        // --- TAREA 1: Validación y Saneamiento de Entradas (Prevención de Inyección) ---
        // Como proxy a una API en lugar de una base de datos SQL directa, saneamos estrictamente los parámetros de la URL
        const allowedParams = ['limit', 'gender', 'tags', 'search', 'status', 'isLovenseOnly', 'isHdOnly', 'language', 'profileEthnicity', 'profileHairColor', 'profileBodyType', 'sort'];
        const safeParams = new URLSearchParams();

        url.searchParams.forEach((value, key) => {
          if (allowedParams.includes(key)) {
            // Saneamiento riguroso: solo permite letras, números, espacios y guiones
            // Previene inyecciones XSS, NoSQL o de cabeceras en el sistema destino
            const sanitizedValue = value.replace(/[^\w\s\-\.,ñáéíóúÁÉÍÓÚ]/gi, '').trim();
            if (sanitizedValue) {
              safeParams.append(key, sanitizedValue);
            }
          }
        });

        // Forzar límite máximo seguro
        let limitVal = parseInt(safeParams.get('limit') || '300', 10);
        if (isNaN(limitVal) || limitVal < 1 || limitVal > 500) {
          limitVal = 300;
        }
        safeParams.set('limit', limitVal.toString());
        
        // REQUERIMIENTO DE SEGURIDAD: Nunca mostrar modelos offline o en shows privados.
        // Forzamos siempre el status a 'public' para que Stripcash devuelva solo modelos en free chat.
        safeParams.set('status', 'public');

        // 1. Verificar si la respuesta ya existe en la Cache API de Cloudflare
        const cacheUrl = new URL(request.url);
        const cache = caches.default;
        let response = await cache.match(cacheUrl);

        if (response) {
          // Respuesta servida instantáneamente desde la caché Edge de Cloudflare
          return response;
        }

        const targetUrl = new URL('https://go.whitetrafsa.com/api/models');
        // Usar EXCLUSIVAMENTE los parámetros saneados
        safeParams.forEach((value, key) => {
          targetUrl.searchParams.append(key, value);
        });

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

        // 3. Crear la respuesta asignando cabeceras de caché por 60 segundos
        response = new Response(JSON.stringify(formattedModels), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=120'
          }
        });

        // 4. Guardar en la memoria global de Cloudflare asíncronamente
        ctx.waitUntil(cache.put(cacheUrl, response.clone()));

        return response;
      } catch (err: any) {
        return new Response(JSON.stringify({ error: 'Excepción en Cloudflare Worker', details: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    // Si la petición no es de API, delegarla a los assets estáticos de Cloudflare (y manejar React Router SPA)
    if (!url.pathname.startsWith('/api')) {
      if (env.ASSETS) {
        try {
          let response = await env.ASSETS.fetch(request);
          // Si el archivo no existe (ej. una ruta de React como /model/123), servimos el index.html
          if (response.status === 404) {
            const indexUrl = new URL(request.url);
            indexUrl.pathname = '/index.html';
            return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
          }
          return response;
        } catch (e) {
          return new Response("Error sirviendo assets: " + String(e), { status: 500 });
        }
      } else {
        return new Response("Error de configuración: No se encontró env.ASSETS", { status: 500 });
      }
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
