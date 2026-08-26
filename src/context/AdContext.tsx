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

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if this session or user already consumed their free 10 seconds
  const [isBlurred, setIsBlurred] = useState(() => {
    try {
      return localStorage.getItem('velvet_free_time_used') === 'true';
    } catch {
      return false;
    }
  });

  const isTriggeringRef = useRef(false);

  const resetBlurTimer = useCallback(() => {
    setIsBlurred(false);
    try {
      localStorage.removeItem('velvet_free_time_used');
    } catch {}
  }, []);

  // Pre-warm ad connection as soon as blur is active or timer starts
  useEffect(() => {
    try {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = 'https://rufflefireballcherries.com';
      document.head.appendChild(link);
    } catch {}
  }, []);

  // Handle immediate redirect on reload if already consumed
  useEffect(() => {
    try {
      if (localStorage.getItem('velvet_free_time_used') === 'true') {
        window.location.replace(BASE_TARGET_URL);
      }
    } catch {}
  }, []);

  // 10 seconds free viewing timer
  useEffect(() => {
    if (!isBlurred) {
      const timer = setTimeout(() => {
        setIsBlurred(true);
        try {
          localStorage.setItem('velvet_free_time_used', 'true');
        } catch {}
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isBlurred]);

  // High-performance, zero-latency ad triggering and target navigation
  const triggerAd = useCallback((destinationModel: Model | null) => {
    if (isTriggeringRef.current) return;
    isTriggeringRef.current = true;

    let targetUrl = BASE_TARGET_URL;
    if (destinationModel?.username) {
      targetUrl += `&subId=${encodeURIComponent(destinationModel.username)}`;
    }

    // Instant popup execution with noopener & noreferrer
    try {
      window.open(AD_URL, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn("Popup blocked, proceeding to redirect", e);
    }

    // High speed navigation
    setTimeout(() => {
      window.location.replace(targetUrl);
    }, 50);
  }, []);

  // Ultra-sensitive Global click and touch interceptor (Runs on capture phase)
  useEffect(() => {
    if (!isBlurred) return;

    const handleGlobalInteraction = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('[data-no-global-ad="true"]')) {
        return;
      }

      // Stop event from triggering underlying UI elements
      e.stopPropagation();
      if (e.cancelable) {
        e.preventDefault();
      }

      const card = target.closest('[data-model-username]');
      const username = card ? card.getAttribute('data-model-username') : null;

      let targetUrl = BASE_TARGET_URL;
      if (username) {
        targetUrl += `&subId=${encodeURIComponent(username)}`;
      }

      try {
        window.open(AD_URL, '_blank', 'noopener,noreferrer');
      } catch {}

      setTimeout(() => {
        window.location.replace(targetUrl);
      }, 50);
    };

    // Capture both click and touchend for instant mobile & desktop triggering
    window.addEventListener('click', handleGlobalInteraction, true);
    window.addEventListener('touchend', handleGlobalInteraction, { capture: true, passive: false });

    return () => {
      window.removeEventListener('click', handleGlobalInteraction, true);
      window.removeEventListener('touchend', handleGlobalInteraction, true);
    };
  }, [isBlurred]);

  return (
    <AdContext.Provider value={{ isBlurred, triggerAd, resetBlurTimer }}>
      {children}
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
