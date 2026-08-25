import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Model } from '@/lib/types';

interface AdContextType {
  isBlurred: boolean;
  triggerAd: (destinationModel: Model | null) => void;
  resetBlurTimer: () => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage so we know if they already used their free time
  const [isBlurred, setIsBlurred] = useState(() => {
    return localStorage.getItem('velvet_free_time_used') === 'true';
  });
  
  const AD_URL = "https://rufflefireballcherries.com/y9d9gqexi?key=264343709ea6a16037ccc01e914fe016";

  const resetBlurTimer = useCallback(() => {
    setIsBlurred(false);
    localStorage.removeItem('velvet_free_time_used');
  }, []);

  // Handle reload redirect immediately if already consumed
  useEffect(() => {
    if (localStorage.getItem('velvet_free_time_used') === 'true') {
      // If the user reloads the page and had already exhausted their 10 seconds,
      // redirect them immediately to the origin web without restrictions.
      window.location.href = "https://go.whitetrafsa.com?userId=a703e07cc602c7aecb72a257e7ece3fff9655e7eab57b09d95e4be998475cce2";
    }
  }, []);

  // Timer of 10 seconds of free view upon mount/reload
  useEffect(() => {
    if (!isBlurred) {
      const timer = setTimeout(() => {
        setIsBlurred(true);
        localStorage.setItem('velvet_free_time_used', 'true');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isBlurred]); // Reset timer when blurred is manually reset

  // Manual trigger for programmatic calls
  const triggerAd = useCallback((destinationModel: Model | null) => {
    let targetUrl = "https://go.whitetrafsa.com?userId=a703e07cc602c7aecb72a257e7ece3fff9655e7eab57b09d95e4be998475cce2";
    if (destinationModel?.username) {
      targetUrl += `&subId=${encodeURIComponent(destinationModel.username)}`;
    }
    try {
      window.open(AD_URL, '_blank');
    } catch (e) {
      console.error("Popup blocked or failed", e);
    }
    window.location.href = targetUrl;
  }, []);

  // Highly sensitive Global click interceptor
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // ONLY intercept clicks if the blur is active. During the first 10 seconds, app works normally.
      if (!isBlurred) return;

      const target = e.target as HTMLElement;
      if (target.closest('[data-no-global-ad="true"]')) {
        return;
      }
      
      // Stop all propagation and default behavior so the underlying UI does not react
      e.stopPropagation();
      e.preventDefault();

      // Extract username if clicked inside a model card for subId tracking
      const card = target.closest('[data-model-username]');
      const username = card ? card.getAttribute('data-model-username') : null;
      
      let targetUrl = "https://go.whitetrafsa.com?userId=a703e07cc602c7aecb72a257e7ece3fff9655e7eab57b09d95e4be998475cce2";
      if (username) {
        targetUrl += `&subId=${encodeURIComponent(username)}`;
      }
      
      try {
        window.open(AD_URL, '_blank');
      } catch (err) {}
      
      window.location.href = targetUrl;
    };

    // Use capture phase (true) to intercept BEFORE React's synthetic event system
    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
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
