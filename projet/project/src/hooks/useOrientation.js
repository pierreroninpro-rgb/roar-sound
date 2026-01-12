import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour détecter l'orientation de l'écran (portrait/paysage)
 * @returns {boolean} true si l'écran est en mode paysage, false si en mode portrait
 */
export const useOrientation = () => {
  const [isLandscape, setIsLandscape] = useState(() => {
    // Vérification initiale
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight;
    }
    return false;
  });

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    // Écouter les changements de taille de fenêtre
    window.addEventListener('resize', checkOrientation);
    
    // Écouter les changements d'orientation (pour les appareils mobiles)
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation);
    } else if (window.orientation !== undefined) {
      // Fallback pour les anciens navigateurs
      window.addEventListener('orientationchange', checkOrientation);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', checkOrientation);
      } else if (window.orientation !== undefined) {
        window.removeEventListener('orientationchange', checkOrientation);
      }
    };
  }, []);

  return isLandscape;
};
