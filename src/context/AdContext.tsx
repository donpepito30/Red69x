import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Model } from '@/lib/types';

interface AdContextType {
  isBlurred: boolean;
  isTimeExpired: boolean;
  freeAccessUntil: number;
  secondsLeft: number;
  triggerAd: (destinationModel: Model | null) => void;
  resetBlurTimer: () => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

const AD_URL = "https://rufflefireballcherries.com/y9d9gqexi?key=264343709ea6a16037ccc01e914fe016";
const BASE_TARGET_URL = "https://go.whitetrafsa.com?userId=a703e07cc602c7aecb72a257e7ece3fff9655e7eab57b09d95e4be998475cce2";
const FREE_ACCESS_MS = 2 * 60 * 1000; // Exactamente 2 minutos de acceso libre (120,000 ms)

// Utilidad criptográfica liviana para evitar manipulación de localStorage vía F12 / Consola
const computeSecurityHash = (time: number, clicks: number): string => {
  return btoa(`${time}_${clicks}_redex_guard_sec_2026`).slice(0, 24);
};

// Verificación multicapa (localStorage + sessionStorage + Cookie) para detectar si ya expiró
const checkIsExpiredPermanently = (): boolean => {
  try {
    const ls = localStorage.getItem('redex_trial_expired_forever') === '1';
    const ss = sessionStorage.getItem('redex_trial_expired_forever') === '1';
    const ck = typeof document !== 'undefined' && document.cookie.includes('redex_trial_expired_forever=1');
    return ls || ss || ck;
  } catch {
    return false;
  }
};

// Marcar de forma permanente en todas las capas de almacenamiento del navegador
const markExpiredPermanently = () => {
  try {
    localStorage.setItem('redex_trial_expired_forever', '1');
    sessionStorage.setItem('redex_trial_expired_forever', '1');
    if (typeof document !== 'undefined') {
      document.cookie = "redex_trial_expired_forever=1; max-age=31536000; path=/; SameSite=Lax";
    }
  } catch {}
};

// Destruir y cancelar de inmediato todo el streaming activo para evitar fugas en segundo plano
const killAllMediaStreams = () => {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('video, audio').forEach((media) => {
    try {
      const el = media as HTMLMediaElement;
      el.pause();
      el.removeAttribute('src');
      el.load();
      el.remove();
    } catch {}
  });
};

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Detección inmediata en carga: si el usuario ya consumió su tiempo y regresa, redirección directa a Stripchat
  if (typeof window !== 'undefined' && checkIsExpiredPermanently()) {
    window.location.replace(BASE_TARGET_URL);
  }

  // 2. Carga y validación estricta de Clics Publicitarios
  const [adClicks, setAdClicks] = useState<number>(() => {
    try {
      const stored = parseInt(localStorage.getItem('velvet_ad_clicks') || '0', 10);
      return isNaN(stored) || stored < 0 ? 0 : Math.min(stored, 2);
    } catch {
      return 0;
    }
  });

  // 3. Carga y verificación anti-manipulación de tiempo libre
  const [freeAccessUntil, setFreeAccessUntil] = useState<number>(() => {
    try {
      const storedUntil = parseInt(localStorage.getItem('velvet_free_access_until') || '0', 10);
      const storedClicks = parseInt(localStorage.getItem('velvet_ad_clicks') || '0', 10);
      const storedHash = localStorage.getItem('velvet_sec_hash') || '';

      if (storedUntil > 0) {
        // Bloqueo Anti-Trampa: El tiempo no puede ser creado sin los 2 clics requeridos
        if (storedClicks < 2) return 0;

        // Bloqueo Anti-Trampa: Un usuario no puede inyectar un timestamp futuro artificial
        const now = Date.now();
        if (storedUntil > now + FREE_ACCESS_MS + 2000) {
          console.warn("[Seguridad] Manipulación de timestamp detectada. Reseteando acceso.");
          localStorage.removeItem('velvet_free_access_until');
          localStorage.removeItem('velvet_sec_hash');
          return 0;
        }

        // Bloqueo Anti-Trampa: Verificar firma criptográfica
        if (storedHash !== computeSecurityHash(storedUntil, storedClicks)) {
          console.warn("[Seguridad] Firma de integridad inválida. Reseteando acceso.");
          localStorage.removeItem('velvet_free_access_until');
          localStorage.removeItem('velvet_sec_hash');
          return 0;
        }

        // Si ya expiró el tiempo guardado, marcarlo permanentemente
        if (now >= storedUntil) {
          markExpiredPermanently();
          window.location.replace(BASE_TARGET_URL);
          return 0;
        }

        return storedUntil;
      }
      return 0;
    } catch {
      return 0;
    }
  });

  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(() => checkIsExpiredPermanently());
  const [isBlurred, setIsBlurred] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const isTriggeringRef = useRef<boolean>(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Pre-conexión DNS hacia los servidores publicitarios
  useEffect(() => {
    try {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = 'https://rufflefireballcherries.com';
      document.head.appendChild(link);
    } catch {}
  }, []);

  // Contador regresivo en tiempo real para la UI
  useEffect(() => {
    if (freeAccessUntil > 0 && !isTimeExpired) {
      const update = () => {
        const remaining = Math.max(0, Math.floor((freeAccessUntil - Date.now()) / 1000));
        setSecondsLeft(remaining);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      setSecondsLeft(0);
    }
  }, [freeAccessUntil, isTimeExpired]);

  // Manejo del ciclo de vida del tiempo y expiración
  useEffect(() => {
    const now = Date.now();

    if (freeAccessUntil > 0) {
      if (now >= freeAccessUntil) {
        // Expirado
        markExpiredPermanently();
        setIsTimeExpired(true);
        killAllMediaStreams();
        window.location.replace(BASE_TARGET_URL);
      } else {
        // En período de acceso libre de 2 minutos
        setIsBlurred(false);
        const remaining = freeAccessUntil - now;
        const timer = setTimeout(() => {
          markExpiredPermanently();
          setIsTimeExpired(true);
          killAllMediaStreams();
        }, remaining);
        return () => clearTimeout(timer);
      }
    } else {
      // Aún no desbloquea acceso libre: blur tras 10 segundos
      if (adClicks < 2 && !isTimeExpired) {
        const timer = setTimeout(() => {
          setIsBlurred(true);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [freeAccessUntil, adClicks, isTimeExpired]);

  // Watchdog Anti-Fuga cuando expira el tiempo:
  // 1. Destruye cualquier video/audio que intente reproducirse en background.
  // 2. Si el usuario intenta burlar el modal borrándolo con F12, se detecta y redirige de inmediato.
  // 3. Auto-redirección de seguridad a los 15 segundos si no interactúa.
  useEffect(() => {
    if (!isTimeExpired) return;

    // Matar medios inmediatamente
    killAllMediaStreams();

    // Watchdog recurrente cada 1.5s
    const mediaWatchdog = setInterval(() => {
      killAllMediaStreams();

      // Si el elemento modal fue removido del DOM mediante "Inspect Element / Delete Node", redirigir forzosamente
      if (modalContainerRef.current && !document.body.contains(modalContainerRef.current)) {
        window.location.replace(BASE_TARGET_URL);
      }
    }, 1500);

    // Auto-redirección forzada tras 15 segundos si el usuario ignora el modal
    const autoRedirectTimer = setTimeout(() => {
      window.location.replace(BASE_TARGET_URL);
    }, 15000);

    return () => {
      clearInterval(mediaWatchdog);
      clearTimeout(autoRedirectTimer);
    };
  }, [isTimeExpired]);

  const resetBlurTimer = useCallback(() => {
    setIsBlurred(false);
    setIsTimeExpired(false);
    setAdClicks(0);
    setFreeAccessUntil(0);
    setSecondsLeft(0);
    try {
      localStorage.removeItem('velvet_ad_clicks');
      localStorage.removeItem('velvet_free_access_until');
      localStorage.removeItem('velvet_sec_hash');
      localStorage.removeItem('redex_trial_expired_forever');
      sessionStorage.removeItem('redex_trial_expired_forever');
      document.cookie = "redex_trial_expired_forever=; max-age=0; path=/;";
    } catch {}
  }, []);

  const handleAdTrigger = useCallback(() => {
    if (isTimeExpired || checkIsExpiredPermanently()) {
      window.location.replace(BASE_TARGET_URL);
      return;
    }

    if (freeAccessUntil > 0 || adClicks >= 2) return;

    if (isTriggeringRef.current) return;
    isTriggeringRef.current = true;

    try {
      window.open(AD_URL, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn("Popup bloqueado", e);
    }

    const newCount = adClicks + 1;
    setAdClicks(newCount);
    try {
      localStorage.setItem('velvet_ad_clicks', newCount.toString());
    } catch {}

    if (newCount >= 2) {
      // Desbloqueo oficial de los 2 minutos libres con firma de seguridad
      const unlockTime = Date.now() + FREE_ACCESS_MS;
      const signature = computeSecurityHash(unlockTime, newCount);

      setFreeAccessUntil(unlockTime);
      try {
        localStorage.setItem('velvet_free_access_until', unlockTime.toString());
        localStorage.setItem('velvet_sec_hash', signature);
      } catch {}
      setIsBlurred(false);
    }

    setTimeout(() => {
      isTriggeringRef.current = false;
    }, 1000);
  }, [adClicks, freeAccessUntil, isTimeExpired]);

  const triggerAd = useCallback((_destinationModel: Model | null) => {
    handleAdTrigger();
  }, [handleAdTrigger]);

  // Interceptor global de toques y clics cuando la pantalla está borrosa
  useEffect(() => {
    if (!isBlurred || freeAccessUntil > 0 || isTimeExpired) return;

    const handleGlobalInteraction = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-no-global-ad="true"]')) {
        return;
      }
      handleAdTrigger();
    };

    window.addEventListener('click', handleGlobalInteraction, true);
    window.addEventListener('touchend', handleGlobalInteraction, { capture: true, passive: false });

    return () => {
      window.removeEventListener('click', handleGlobalInteraction, true);
      window.removeEventListener('touchend', handleGlobalInteraction, true);
    };
  }, [isBlurred, freeAccessUntil, isTimeExpired, handleAdTrigger]);

  return (
    <AdContext.Provider value={{ isBlurred, isTimeExpired, freeAccessUntil, secondsLeft, triggerAd, resetBlurTimer }}>
      {children}

      {/* Modal Ineludible de Expiración (2 Minutos Concluidos) */}
      {isTimeExpired && (
        <div 
          ref={modalContainerRef}
          className="fixed inset-0 z-[99999] bg-zinc-950/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none touch-none"
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
            <h2 className="text-xl sm:text-2xl font-black text-white mb-3">Tiempo Libre Finalizado</h2>
            <p className="text-zinc-400 mb-6 sm:mb-8 leading-relaxed text-xs sm:text-sm">
              Tu acceso gratuito de 2 minutos ha concluido. Para continuar viendo transmisiones en vivo sin límites y en alta definición, ingresa a Stripchat de forma 100% gratuita.
            </p>
            <div className="flex flex-col gap-3">
              <a 
                href={BASE_TARGET_URL} 
                className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 font-black py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
              >
                Continuar en Stripchat Gratis
              </a>
              <button 
                onClick={() => window.location.href = 'https://google.com'}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-colors text-xs sm:text-sm"
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
