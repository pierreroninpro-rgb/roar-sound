import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import VideoList from '../components/VideoList.jsx';
import { useOrientation } from '../hooks/useOrientation';
import Preloader from '../components/Preloader.jsx';

const Projects = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const isLandscape = useOrientation();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 820;

    useEffect(() => {
        // S'assurer que le preloader reste visible pendant au moins 0.5 secondes
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // Bloquer l'orientation en portrait sur mobile (sauf en plein écran vidéo)
    useEffect(() => {
        if (!isMobile || isFullscreen) return; // Ne pas bloquer si on est en plein écran vidéo

        // Vérifier si l'API Screen Orientation est disponible
        if (screen.orientation && screen.orientation.lock) {
            // Essayer de verrouiller en portrait
            // Note: Nécessite une interaction utilisateur (peut ne pas fonctionner immédiatement)
            const lockOrientation = async () => {
                try {
                    await screen.orientation.lock('portrait');
                } catch (err) {
                    // L'API peut nécessiter une interaction utilisateur ou ne pas être supportée
                    console.log("Orientation lock not available or requires user gesture:", err);
                }
            };

            // Essayer de verrouiller après un court délai (peut ne pas fonctionner sans interaction)
            lockOrientation();

            // Écouter les changements d'orientation et essayer de re-verrouiller
            const handleOrientationChange = () => {
                if (isLandscape && !isFullscreen) {
                    lockOrientation();
                }
            };

            window.addEventListener('orientationchange', handleOrientationChange);
            screen.orientation?.addEventListener('change', handleOrientationChange);

            return () => {
                window.removeEventListener('orientationchange', handleOrientationChange);
                screen.orientation?.removeEventListener('change', handleOrientationChange);
                
                // Déverrouiller l'orientation à la destruction du composant (sauf si on est en plein écran)
                if (!isFullscreen && screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock().catch(() => {
                        // Ignorer les erreurs lors du déverrouillage
                    });
                }
            };
        }
    }, [isMobile, isLandscape, isFullscreen]);

    return (
        <>
            {isLoading && <Preloader onComplete={() => setIsLoading(false)} duration={500} />}
            <div className="w-full h-screen scrollbar-hide md:mb-[32px]" style={{ 
                backgroundColor: '#F6F6F6',
                overflow: (isMobile && isLandscape) ? 'hidden' : (isMobile && !isLandscape) ? 'hidden' : 'auto', // Cacher le scroll en mobile (portrait et paysage)
                overflowX: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {!isFullscreen && (
                    <div className="relative z-[100] text-grey-dark font-HelveticaNeue font-[400]" style={{ fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif" }}>
                        <Navbar />
                    </div>
                )}

                <div>
                    <VideoList onFullscreenChange={setIsFullscreen} />
                </div>

            </div>
        </>
    );
};

export default Projects;