import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Model } from '@/lib/types';

interface AdContextType {
  isBlurred: boolean;
  triggerAd: (destinationModel: Model | null) => void;
  resetBlurTimer: () => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBlurred, setIsBlurred] = useState(false);
  const AD_URL = "https://rufflefireballcherries.com/y9d9gqexi?key=264343709ea6a16037ccc01e914fe016";

  // Reset the 10-second blur timer
  const resetBlurTimer = useCallback(() => {
    setIsBlurred(false);
  }, []);

  // Timer of 10 seconds of free view upon mount/reload
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBlurred(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [isBlurred]); // Reset timer when blurred is manually reset

  // Triggering the ad redirect followed by affiliate link or model page redirect
  const triggerAd = useCallback((destinationModel: Model | null) => {
    // Determine the redirect target URL using the user's explicit referral link
    let targetUrl = "https://go.whitetrafsa.com?userId=a703e07cc602c7aecb72a257e7ece3fff9655e7eab57b09d95e4be998475cce2";
    
    if (destinationModel?.username) {
      targetUrl += `&subId=${encodeURIComponent(destinationModel.username)}`;
    }

    // Open Adsterra ad link in a new window/tab
    try {
      window.open(AD_URL, '_blank');
    } catch (e) {
      console.error("Popup blocked or failed", e);
    }

    // Instantly also navigate current window to the referral target URL
    window.location.href = targetUrl;
  }, []);

  // Global click interceptor: if user clicks ANYWHERE before or after the blur,
  // click serves as a trigger to display the ad and redirect.
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Find out if the click was already handled by specific components with triggerAd
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-global-ad="true"]')) {
        return;
      }
      
      // If clicked before or after blur, trigger the general ad redirect
      triggerAd(null);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [triggerAd]);

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
