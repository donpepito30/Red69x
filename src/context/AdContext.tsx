import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Model } from '@/lib/types';

interface AdContextType {
  isBlurred: boolean;
  triggerAd: (destinationModel: Model | null) => void;
  resetBlurTimer: () => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

const AD_URL = "https://rufflefireballcherries.com/y9d9gqexi?key=264343709ea6a16037ccc01e914fe016";
const BASE_TARGET_URL = "https://go.whitetrafsa.com?userId=a703e07cc602c7aecb72a257e7ece3fff9655e7eab57b09d95e4be998475cce2";
const FREE_ACCESS_MS = 3 * 60 * 1000; // 3 minutes

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adClicks, setAdClicks] = useState(() => {
    try {
      return parseInt(localStorage.getItem('velvet_ad_clicks') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [freeAccessUntil, setFreeAccessUntil] = useState(() => {
    try {
      return parseInt(localStorage.getItem('velvet_free_access_until') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const isTriggeringRef = useRef(false);

  // Pre-warm ad connection
  useEffect(() => {
    try {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = 'https://rufflefireballcherries.com';
      document.head.appendChild(link);
    } catch {}
  }, []);

  // Main timer and state management
  useEffect(() => {
    const now = Date.now();
    
    if (freeAccessUntil > 0) {
      if (now >= freeAccessUntil) {
        // Time expired! If they just loaded the page, direct redirect.
        window.location.replace(BASE_TARGET_URL);
      } else {
        // Inside the 3 free minutes
        setIsBlurred(false);
        const remaining = freeAccessUntil - now;
        const timer = setTimeout(() => {
          setIsTimeExpired(true);
        }, remaining);
        return () => clearTimeout(timer);
      }
    } else {
      // No free access unlocked yet. Wait 10s, then blur.
      if (adClicks < 2) {
        const timer = setTimeout(() => {
          setIsBlurred(true);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [freeAccessUntil, adClicks]);

  const resetBlurTimer = useCallback(() => {
    setIsBlurred(false);
    setIsTimeExpired(false);
    setAdClicks(0);
    setFreeAccessUntil(0);
    try {
      localStorage.removeItem('velvet_ad_clicks');
      localStorage.removeItem('velvet_free_access_until');
      localStorage.removeItem('velvet_free_time_used');
    } catch {}
  }, []);

  const handleAdTrigger = useCallback(() => {
    // If free access unlocked, or expired, don't trigger more ads
    if (freeAccessUntil > 0 || adClicks >= 2) return;

    if (isTriggeringRef.current) return;
    isTriggeringRef.current = true;

    try {
      window.open(AD_URL, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn("Popup blocked", e);
    }
    
    const newCount = adClicks + 1;
    setAdClicks(newCount);
    try {
      localStorage.setItem('velvet_ad_clicks', newCount.toString());
    } catch {}

    if (newCount >= 2) {
      // Unlock!
      const unlockTime = Date.now() + FREE_ACCESS_MS;
      setFreeAccessUntil(unlockTime);
      try {
        localStorage.setItem('velvet_free_access_until', unlockTime.toString());
      } catch {}
      setIsBlurred(false);
    }

    setTimeout(() => {
      isTriggeringRef.current = false;
    }, 1000);
  }, [adClicks, freeAccessUntil]);

  const triggerAd = useCallback((destinationModel: Model | null) => {
    handleAdTrigger();
  }, [handleAdTrigger]);

  // Global click and touch interceptor
  useEffect(() => {
    if (!isBlurred || freeAccessUntil > 0) return;

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
  }, [isBlurred, freeAccessUntil, handleAdTrigger]);

  return (
    <AdContext.Provider value={{ isBlurred, triggerAd, resetBlurTimer }}>
      {children}

      {/* Time Expired Modal Overlay */}
      {isTimeExpired && (
        <div className="fixed inset-0 z-[99999] bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg 
                className="w-10 h-10 text-rose-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-4">Tiempo Finalizado</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed text-sm">
              Tu acceso gratuito de 3 minutos ha concluido. Para seguir viendo transmisiones sin límites y en alta definición, accede a Stripchat gratis.
            </p>
            <div className="flex flex-col gap-3">
              <a 
                href={BASE_TARGET_URL} 
                className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 font-black py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                Ingresar a Stripchat
              </a>
              <button 
                onClick={() => window.location.href = 'https://google.com'}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
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
