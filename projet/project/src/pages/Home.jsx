import React, { useRef, useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import LoaderHome from '../components/LoaderHome.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import EnterButton from '../components/EnterButton.jsx';
import SoundButton from '../components/SoundButton.jsx';
import { gsap } from 'gsap';
import { useOrientation } from '../hooks/useOrientation';

const Home = () => {
    const overlayRef = useRef(null);
    const videoRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const isLandscape = useOrientation();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 820;

    // Bloquer l'orientation en portrait sur mobile
    useEffect(() => {
        if (!isMobile) return;

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
                if (isLandscape) {
                    lockOrientation();
                }
            };

            window.addEventListener('orientationchange', handleOrientationChange);
            screen.orientation?.addEventListener('change', handleOrientationChange);

            return () => {
                window.removeEventListener('orientationchange', handleOrientationChange);
                screen.orientation?.removeEventListener('change', handleOrientationChange);
                
                // Déverrouiller l'orientation à la destruction du composant
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock().catch(() => {
                        // Ignorer les erreurs lors du déverrouillage
                    });
                }
            };
        }
    }, [isMobile, isLandscape]);

    const handleVideoLoad = () => {
        fadeOutLoader();
    };

    const fadeOutLoader = () => {
        gsap.to(overlayRef.current, {
            opacity: 0,
            duration: 1,
            onComplete: () => setLoading(false),
        });

        gsap.to(videoRef.current, { opacity: 1, duration: 1 });
    };

    // Gestionnaire de clic pour rediriger vers Projects (sauf sur navbar et sound button)
    const handlePageClick = (e) => {
        // Ne pas rediriger si on clique sur la navbar ou le sound button
        // Ces éléments ont déjà leur propre gestionnaire de clic
        if (e.target.closest('[data-exclude-click]')) {
            return;
        }
        
        // Ne rediriger que si le chargement est terminé
        if (!loading) {
            window.location.href = '/Projects';
        }
    };

    return (
        <div 
            className="relative w-screen h-[100dvh] scrollbar-hide no-scrollbar cursor-pointer" 
            onClick={handlePageClick}
            style={{
                overflow: 'hidden', // Désactiver complètement le scroll
                overflowX: 'hidden',
                overflowY: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}
        >
            {/* Navbar avec marge top responsive */}
            <div 
                className="relative z-[300] font-HelveticaNeue font-[400] text-custom-grey"
                data-exclude-click
                onClick={(e) => e.stopPropagation()}
            >
                <Navbar />
            </div>

            {/* Vidéo Vimeo */}
            <VideoPlayer onVideoLoad={handleVideoLoad} videoRef={videoRef} />

            {/* Loader original */}
            {loading && (
                <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{ pointerEvents: 'auto' }}
                >
                    <LoaderHome overlayRef={overlayRef} />
                </div>
            )}

            {/* Contenu après chargement - toujours rendus mais cachés jusqu'à ce que loading soit false */}
            <EnterButton show={!loading} />
            <div 
                data-exclude-click
                onClick={(e) => e.stopPropagation()}
            >
                <SoundButton videoRef={videoRef} show={!loading} />
            </div>
        </div>
    );
};

export default Home;
