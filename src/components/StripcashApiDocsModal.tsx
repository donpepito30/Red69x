

import React, { useState, useEffect, useCallback } from 'react';
import { X, Code2, Copy, Check, Play, ExternalLink, RefreshCw, Terminal, Layers } from 'lucide-react';

interface StripcashApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StripcashApiDocsModal: React.FC<StripcashApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tester' | 'docs' | 'code' | 'embed'>('tester');
  const [copied, setCopied] = useState(false);
  const [apiGender, setApiGender] = useState('female');
  const [apiLimit, setApiLimit] = useState('5');
  const [apiStatus, setApiStatus] = useState('online');
  const [jsonResult, setJsonResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [affiliateId, setAffiliateId] = useState('aff_velvet_99');

  const fetchApiResponse = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = `/api/models?gender=${apiGender}&limit=${apiLimit}&status=${apiStatus}&aff=${affiliateId}`;
      const res = await fetch(url);
      const data = await res.json();
      setJsonResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [apiGender, apiLimit, apiStatus, affiliateId]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (isOpen && isMounted) {
        await fetchApiResponse();
      }
    };
    void run();
    return () => { isMounted = false; };
  }, [isOpen, fetchApiResponse]);



  if (!isOpen) return null;

  const endpointUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/models?gender=${apiGender}&limit=${apiLimit}&status=${apiStatus}&aff=${affiliateId}`;

  const jsCodeSnippet = `// Stripcash API Fetch Model List
async function getOnlineModels() {
  const response = await fetch("${endpointUrl}");
  const data = await response.json();
  console.log("Online Models:", data.models);
  return data.models;
}

getOnlineModels();`;

  const curlSnippet = `curl -X GET "${endpointUrl}" \\
  -H "Accept: application/json"`;

  const pythonSnippet = `import requests

url = "${endpointUrl}"
response = requests.get(url)
models_data = response.json()

for model in models_data.get('models', []):
    print(f"Model: {model['username']} | Viewers: {model['viewers_count']} | Embed: {model['iframe_embed_url']}")`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full h-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                Stripcash API Documentation Hub
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md font-bold">ONLINE MODELS LIST</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Respuesta estructurada conforme a la especificación oficial de Stripcash API (<code className="text-rose-400">api/models</code>).
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-3 bg-zinc-950 border-b border-zinc-800 overflow-x-auto">
          {[
            { id: 'tester', label: 'Prueba de API en Tiempo Real', icon: Terminal },
            { id: 'docs', label: 'Campos y Parámetros JSON', icon: Layers },
            { id: 'code', label: 'Ejemplos de Código (JS, Python, cURL)', icon: Code2 },
            { id: 'embed', label: 'Iframe & Embeds', icon: ExternalLink },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: API REAL-TIME TESTER */}
        {activeTab === 'tester' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            
            {/* Filter controls */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Género (gender)</label>
                <select
                  value={apiGender}
                  onChange={(e) => setApiGender(e.target.value)}
                  className="w-full bg-zinc-950 text-white p-2 rounded-xl border border-zinc-800 outline-none"
                >
                  <option value="female">female (Mujeres)</option>
                  <option value="couple">couple (Parejas)</option>
                  <option value="trans">trans (Trans)</option>
                  <option value="male">male (Hombres)</option>
                  <option value="all">all (Todos)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Límite (limit)</label>
                <select
                  value={apiLimit}
                  onChange={(e) => setApiLimit(e.target.value)}
                  className="w-full bg-zinc-950 text-white p-2 rounded-xl border border-zinc-800 outline-none"
                >
                  <option value="2">2 modelos</option>
                  <option value="5">5 modelos</option>
                  <option value="10">10 modelos</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Estado (status)</label>
                <select
                  value={apiStatus}
                  onChange={(e) => setApiStatus(e.target.value)}
                  className="w-full bg-zinc-950 text-white p-2 rounded-xl border border-zinc-800 outline-none"
                >
                  <option value="online">online</option>
                  <option value="private">private</option>
                  <option value="all">all</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Affiliate ID (aff)</label>
                <input
                  type="text"
                  value={affiliateId}
                  onChange={(e) => setAffiliateId(e.target.value)}
                  className="w-full bg-zinc-950 text-white p-2 rounded-xl border border-zinc-800 outline-none font-mono"
                />
              </div>
            </div>

            {/* Request URL */}
            <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs font-mono text-rose-400 overflow-x-auto">
              <span className="truncate mr-2">GET {endpointUrl}</span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={fetchApiResponse}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-sans font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Ejecutar</span>
                </button>
                <button
                  onClick={() => handleCopy(endpointUrl)}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Copiar URL"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* JSON Output Viewer */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 overflow-x-auto max-h-[340px]">
              <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed">
                {isLoading ? 'Cargando respuesta del API endpoint...' : JSON.stringify(jsonResult, null, 2)}
              </pre>
            </div>

          </div>
        )}

        {/* TAB 2: CODE SNIPPETS */}
        {activeTab === 'code' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>1. Fetch JavaScript (ES6+ / async)</span>
                <button
                  onClick={() => handleCopy(jsCodeSnippet)}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Código
                </button>
              </div>
              <pre className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs font-mono text-amber-300 overflow-x-auto">
                {jsCodeSnippet}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>2. Comandos cURL (Bash Terminal)</span>
              </div>
              <pre className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                {curlSnippet}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>3. Python Request Script</span>
              </div>
              <pre className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs font-mono text-sky-300 overflow-x-auto">
                {pythonSnippet}
              </pre>
            </div>

          </div>
        )}

        {/* TAB 3: FIELDS DOCS */}
        {activeTab === 'docs' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            <h3 className="font-extrabold text-white text-sm">Parámetros de Entrada (Query Parameters)</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <div className="p-3 grid grid-cols-3 font-bold text-zinc-400 uppercase text-[10px]">
                <span>Parámetro</span>
                <span>Tipo</span>
                <span>Descripción</span>
              </div>
              <div className="p-3 grid grid-cols-3 text-zinc-300">
                <code className="text-rose-400 font-mono">gender</code>
                <span>string</span>
                <span>Filtrar género: female, male, couple, trans, all</span>
              </div>
              <div className="p-3 grid grid-cols-3 text-zinc-300">
                <code className="text-rose-400 font-mono">status</code>
                <span>string</span>
                <span>Filtrar estado: online, private, away, all</span>
              </div>
              <div className="p-3 grid grid-cols-3 text-zinc-300">
                <code className="text-rose-400 font-mono">limit / per_page</code>
                <span>integer</span>
                <span>Cantidad máxima de registros devueltos</span>
              </div>
              <div className="p-3 grid grid-cols-3 text-zinc-300">
                <code className="text-rose-400 font-mono">aff / affiliate_id</code>
                <span>string</span>
                <span>ID de afiliado para los enlaces de rastreo</span>
              </div>
            </div>

            <h3 className="font-extrabold text-white text-sm pt-2">Campos del Objeto Modelo en el Array JSON</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2 text-zinc-400">
              <p><strong className="text-white">id:</strong> Identificador único de la modelo.</p>
              <p><strong className="text-white">username / display_name:</strong> Nombre de usuario y nombre en pantalla.</p>
              <p><strong className="text-white">snapshot_url:</strong> Imagen en vivo actualizada de la cámara.</p>
              <p><strong className="text-white">iframe_embed_url:</strong> URL para embeber el stream directo en cualquier sitio web.</p>
              <p><strong className="text-white">is_lovense:</strong> Valor booleano si la modelo posee juguete interactivo habilitado.</p>
            </div>
          </div>
        )}

        {/* TAB 4: EMBED IFRAME GENERATOR */}
        {activeTab === 'embed' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            <h3 className="font-extrabold text-white text-sm">Generador de Código Iframe para Embeber Cams</h3>
            <p className="text-zinc-400">
              Puedes incrustar el reproductor en vivo de cualquier modelo en tu sitio afiliado usando el siguiente código HTML:
            </p>

            <pre className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs font-mono text-amber-300 overflow-x-auto">
{`<iframe
  src="https://stripchat.com/embed/sophia_latina?aff=${affiliateId}"
  width="100%"
  height="500"
  frameborder="0"
  scrolling="no"
  allowfullscreen>
</iframe>`}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};
