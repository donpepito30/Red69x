import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Model } from '@/lib/types';

interface AdContextType {
  isBlurred: boolean;
  isTimeExpired: boolean;
  freeAccessUntil: number;
  secondsLeft: number;
  isPlaybackActive: boolean;
  setPlaybackActive: (active: boolean) => void;
  triggerAd: (destinationModel: Model | null) => void;
  resetBlurTimer: () => void;
  forceExpireTrial: () => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const AD_URL = "https://rufflefireballcherries.com/y9d9gqexi?key=264343709ea6a16037ccc01e914fe016";

// Enlace oficial de referido de Stripchat / Stripcash (WhiteTraffic Tracking Link)
export const DEFAULT_REFERRAL_URL = "https://go.whitetrafsa.com?userId=a703e07cc602c7aecb72a257e7ece3fff9655e7eab57b09d95e4be998475cce2";

// Soporte para variable de entorno o enlace por defecto de referido
export const BASE_TARGET_URL: string =
  (typeof import.meta !== 'undefined' && ((import.meta as any)?.env?.VITE_AFFILIATE_URL || (import.meta as any)?.env?.VITE_REFERRAL_URL)) ||
  DEFAULT_REFERRAL_URL;

export const TOTAL_FREE_SECONDS = 120; // 2 minutos exactos (120 segundos) de reproducción libre

// Verificación multicapa permanente: localStorage + sessionStorage + Cookie
export const checkIsExpiredPermanently = (): boolean => {
  try {
    const ls = localStorage.getItem('redex_trial_expired_forever') === '1';
    const ss = sessionStorage.getItem('redex_trial_expired_forever') === '1';
    const ck = typeof document !== 'undefined' && document.cookie.includes('redex_trial_expired_forever=1');
    return ls || ss || ck;
  } catch {
    return false;
  }
};

// Marcar permanentemente en todas las capas del navegador
export const markExpiredPermanently = () => {
  try {
    localStorage.setItem('redex_trial_expired_forever', '1');
    localStorage.setItem('redex_trial_seconds_left', '0');
    sessionStorage.setItem('redex_trial_expired_forever', '1');
    sessionStorage.setItem('redex_trial_seconds_left', '0');
    if (typeof document !== 'undefined') {
      document.cookie = "redex_trial_expired_forever=1; max-age=31536000; path=/; SameSite=Lax";
      document.cookie = "redex_trial_seconds_left=0; max-age=31536000; path=/; SameSite=Lax";
    }
  } catch {}
};

// Obtener segundos restantes guardados de forma persistente
const getStoredSecondsLeft = (): number => {
  if (checkIsExpiredPermanently()) return 0;
  try {
    const ls = localStorage.getItem('redex_trial_seconds_left');
    if (ls !== null) {
      const parsed = parseInt(ls, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= TOTAL_FREE_SECONDS) return parsed;
    }
    const ss = sessionStorage.getItem('redex_trial_seconds_left');
    if (ss !== null) {
      const parsed = parseInt(ss, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= TOTAL_FREE_SECONDS) return parsed;
    }
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/redex_trial_seconds_left=(\d+)/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= TOTAL_FREE_SECONDS) return parsed;
      }
    }
    return TOTAL_FREE_SECONDS;
  } catch {
    return TOTAL_FREE_SECONDS;
  }
};

// Guardar segundos en todas las capas persistentes
const saveSecondsLeft = (sec: number) => {
  try {
    localStorage.setItem('redex_trial_seconds_left', sec.toString());
    sessionStorage.setItem('redex_trial_seconds_left', sec.toString());
    if (typeof document !== 'undefined') {
      document.cookie = `redex_trial_seconds_left=${sec}; max-age=31536000; path=/; SameSite=Lax`;
    }
    if (sec <= 0) {
      markExpiredPermanently();
    }
  } catch {}
};

// Forzar salida de pantalla completa y destruir todos los flujos de medios en el DOM
export const killAllMediaStreams = () => {
  if (typeof document === 'undefined') return;

  // 1. Salir de pantalla completa en todos los navegadores/dispositivos (iOS, Android, Chrome, Safari, Firefox)
  try {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    const docAny = document as any;
    if (docAny.webkitFullscreenElement) {
      docAny.webkitExitFullscreen?.();
    }
    if (docAny.mozFullScreenElement) {
      docAny.mozCancelFullScreen?.();
    }
    if (docAny.msFullscreenElement) {
      docAny.msExitFullscreen?.();
    }
  } catch {}

  // 2. Destruir físicamente todas las etiquetas de video y audio
  document.querySelectorAll('video, audio').forEach((media) => {
    try {
      const el = media as HTMLMediaElement;
      const elAny = el as any;
      if (elAny.webkitExitFullscreen) {
        try { elAny.webkitExitFullscreen(); } catch {}
      }
      if (elAny.webkitDisplayingFullscreen && elAny.webkitExitFullScreen) {
        try { elAny.webkitExitFullScreen(); } catch {}
      }
      el.pause();
      el.removeAttribute('src');
      el.load();
      el.remove();
    } catch {}
  });
};

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Detección inmediata en carga
  const alreadyExpired = checkIsExpiredPermanently();

  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(() => alreadyExpired);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => (alreadyExpired ? 0 : getStoredSecondsLeft()));
  const [isPlaybackActive, setIsPlaybackActive] = useState<boolean>(false);
  const [isBlurred, setIsBlurred] = useState<boolean>(false);
  const [adClicks, setAdClicks] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('velvet_ad_clicks') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const isTriggeringRef = useRef<boolean>(false);

  // Pre-conexión DNS hacia los servidores publicitarios
  useEffect(() => {
    try {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = 'https://rufflefireballcherries.com';
      document.head.appendChild(link);
    } catch {}
  }, []);

  // 2. Sincronización inicial con el servidor (Anti-borrado de localStorage vía F12 / Incógnito)
  useEffect(() => {
    if (isTimeExpired) return;

    fetch('/api/trial/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.expired) {
          markExpiredPermanently();
          setIsTimeExpired(true);
          setSecondsLeft(0);
          killAllMediaStreams();
        } else if (typeof data.remainingSeconds === 'number') {
          // Si el servidor tiene menos segundos registrados que el cliente, mandar la del servidor
          setSecondsLeft((currentClient) => {
            const minSec = Math.min(currentClient, data.remainingSeconds);
            if (minSec <= 0) {
              markExpiredPermanently();
              setIsTimeExpired(true);
              killAllMediaStreams();
              return 0;
            }
            saveSecondsLeft(minSec);
            return minSec;
          });
        }
      })
      .catch(() => {});
  }, [isTimeExpired]);

  // 3. Ticking de reproducción en vivo estricto (120 segundos acumulados)
  useEffect(() => {
    if (!isPlaybackActive || isTimeExpired) return;

    let tickCounter = 0;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          markExpiredPermanently();
          setIsTimeExpired(true);
          killAllMediaStreams();
          return 0;
        }

        const next = prev - 1;
        saveSecondsLeft(next);

        // Cada 4 segundos, reportar al servidor para sincronizar estado global
        tickCounter++;
        if (tickCounter % 4 === 0) {
          fetch('/api/trial/tick', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secondsLeft: next }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.expired) {
                markExpiredPermanently();
                setIsTimeExpired(true);
                killAllMediaStreams();
              }
            })
            .catch(() => {});
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaybackActive, isTimeExpired]);

  // 4. Watchdog Anti-Fuga cuando expira el tiempo:
  // - Destruye cualquier video/audio que intente reproducirse en background o fullscreen
  // - Detecta si el usuario intenta borrar el modal con DevTools y redirige de inmediato
  // - Auto-redirección de seguridad a los 15 segundos
  useEffect(() => {
    if (!isTimeExpired) return;

    // Ejecutar matanza de medios inmediatamente
    killAllMediaStreams();

    const mediaWatchdog = setInterval(() => {
      killAllMediaStreams();

      // Si el elemento modal fue removido del DOM mediante "Inspect Element / Delete Node", redirigir forzosamente
      if (modalContainerRef.current && !document.body.contains(modalContainerRef.current)) {
        window.location.replace(BASE_TARGET_URL);
      }
    }, 1000);

    // Auto-redirección forzada tras 15 segundos si el usuario ignora el modal
    const autoRedirectTimer = setTimeout(() => {
      window.location.replace(BASE_TARGET_URL);
    }, 15000);

    return () => {
      clearInterval(mediaWatchdog);
      clearTimeout(autoRedirectTimer);
    };
  }, [isTimeExpired]);

  // 5. Vigilancia de mutación del DOM: si borran el overlay modal, redirección instantánea
  useEffect(() => {
    if (!isTimeExpired) return;

    const observer = new MutationObserver(() => {
      if (modalContainerRef.current && !document.body.contains(modalContainerRef.current)) {
        window.location.replace(BASE_TARGET_URL);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isTimeExpired]);

  // Disparador de publicidad / Monetización Adsterra
  const triggerAd = useCallback((_destinationModel: Model | null) => {
    if (isTimeExpired || checkIsExpiredPermanently()) {
      window.location.replace(BASE_TARGET_URL);
      return;
    }

    if (isTriggeringRef.current) return;
    isTriggeringRef.current = true;

    try {
      window.open(AD_URL, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn("Popup bloqueado", e);
    }

    setAdClicks((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem('velvet_ad_clicks', next.toString());
      } catch {}
      return next;
    });

    setTimeout(() => {
      isTriggeringRef.current = false;
    }, 1200);
  }, [isTimeExpired]);

  const resetBlurTimer = useCallback(() => {
    // Si ya expiró permanentemente, no se permite resetear
    if (checkIsExpiredPermanently()) {
      window.location.replace(BASE_TARGET_URL);
      return;
    }
    setIsBlurred(false);
  }, []);

  const forceExpireTrial = useCallback(() => {
    markExpiredPermanently();
    setIsTimeExpired(true);
    setSecondsLeft(0);
    killAllMediaStreams();
  }, []);

  const freeAccessUntil = !isTimeExpired && secondsLeft > 0 ? Date.now() + secondsLeft * 1000 : 0;

  return (
    <AdContext.Provider
      value={{
        isBlurred,
        isTimeExpired,
        freeAccessUntil,
        secondsLeft,
        isPlaybackActive,
        setPlaybackActive: setIsPlaybackActive,
        triggerAd,
        resetBlurTimer,
        forceExpireTrial,
      }}
    >
      {children}

      {/* Modal Ineludible de Expiración (2 Minutos de Reproducción Concluidos) */}
      {isTimeExpired && (
        <div
          ref={modalContainerRef}
          data-expired-overlay="true"
          className="fixed inset-0 z-[999999] bg-zinc-950/98 backdrop-blur-2xl flex items-center justify-center p-4 select-none touch-none"
          style={{ position: 'fixed', zIndex: 999999 }}
        >
          <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 animate-pulse">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              Tiempo Libre Finalizado
            </h2>
            <div className="inline-block bg-rose-950/70 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold px-3 py-1 rounded-full mb-4">
              Límite de 2 minutos alcanzado
            </div>
            <p className="text-zinc-400 mb-6 sm:mb-8 leading-relaxed text-xs sm:text-sm">
              Has completado los 2 minutos de reproducción gratuita permitidos en cualquier sala o modelo. Para continuar disfrutando de shows ilimitados en alta definición sin restricciones, ingresa a Stripchat de forma 100% gratuita.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={BASE_TARGET_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  try {
                    window.open(BASE_TARGET_URL, '_blank', 'noopener,noreferrer');
                  } catch {
                    window.location.href = BASE_TARGET_URL;
                  }
                }}
                className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 font-black py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
              >
                Continuar en Stripchat Gratis
              </a>
              <button
                onClick={() => {
                  window.location.href = 'https://google.com';
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors text-xs sm:text-sm"
              >
                Salir de la web
              </button>
            </div>
          </div>
        </div>
      )}
    </AdContext.Provider>
  );
};

export const useAd = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAd must be used within an AdProvider');
  }
  return context;
};
