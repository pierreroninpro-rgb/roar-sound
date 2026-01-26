import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { useOrientation } from '../hooks/useOrientation';

const About = () => {
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

    return (
        <div className="w-full h-full scrollbar-hide no-scrollbar" style={{
            backgroundColor: '#F6F6F6',
            overflow: 'hidden', // Désactiver complètement le scroll
            overflowX: 'hidden',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
        }}>
            <div className='text-grey-dark'><Navbar /></div>

            <div className='font-HelveticaNeue font-light text-[12px] md:text-[17px] mt-[18px] m-[18px] mt-[0px] text-grey-dark  '>
                {/* Version Mobile */}
                <div className='block md:hidden'>
                    <p className='mb-[18px]'> <span className='font-medium'>ROAR</span> is a Paris-based studio crafting music and sound design for brands, fashion and film.
                        Past clients include Converse, Ad Council, Giveon, the Kansas City Chiefs and more. </p>
                    <p>Contact: <br></br> Pierre Ronin, Aristide Rosier <br></br> <a href="mailto:hello@roar-sound.com" className="text-grey-dark hover:underline">hello@roar-sound.com</a> <br></br> </p>
                </div>

                {/* Version Desktop */}
                <div className='hidden md:block m-[26px] mt-[0px]'>
                    <p className='mb-[18px]'> <span className='font-medium'>ROAR</span> is a Paris-based studio crafting music and sound design for brands, fashion and film. <br></br>
                        Past clients include Converse, Ad Council, Giveon, the Kansas City Chiefs and more. </p>
                    <p>Contact: <br></br>Pierre Ronin, Aristide Rosier <br></br> <a href="mailto:hello@roar-sound.com" className="text-grey-dark cursor-pointer">hello@roar-sound.com</a> </p>
                </div>
            </div>
        </div>
    );
};

export default About;
