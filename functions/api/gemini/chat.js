export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { prompt, modelUsername } = body;
    
    // Leer del environment de Cloudflare
    const apiKey = context.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not configured in Cloudflare Environment Variables');
      return new Response(JSON.stringify({
        text: `¡Hola amor! Gracias por tu mensaje. ¡Disfruta el show en vivo de ${modelUsername || 'la modelo'}! ❤️`,
        warning: 'API key not configured - using demo response'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: prompt 
            }] 
          }],
          systemInstruction: {
            parts: [{ 
              text: `Estás interpretando a la modelo de transmisión en vivo "${modelUsername || 'modelo'}". 
Tu personalidad es muy coqueta, cariñosa y amigable. 
Responde de manera breve y entusiasta (máximo 2 frases) al mensaje del usuario en el chat live. 
Idioma: Español.` 
            }]
          },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 150
          }
        })
      }
    );

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '¡Gracias por estar en la transmisión! ❤️';
      return new Response(JSON.stringify({ text }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('Gemini API error:', geminiRes.status, geminiRes.statusText);
      return new Response(JSON.stringify({
        text: '¡Hola amor! Gracias por tu mensaje. ¡Disfruta el show en vivo! ❤️'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({
      text: '¡Hola amor! Gracias por tu mensaje. ¡Disfruta el show en vivo! ❤️'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
