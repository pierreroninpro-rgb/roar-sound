import React, { useRef, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Preloader from '../components/Preloader.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import EnterButton from '../components/EnterButton.jsx';
import SoundButton from '../components/SoundButton.jsx';
import { gsap } from 'gsap';
import { useOrientation } from '../hooks/useOrientation';

const Home = () => {
    const overlayRef = useRef(null);
    const videoRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [videoReady, setVideoReady] = useState(false);
    const [showPreloader, setShowPreloader] = useState(true);
    const isLandscape = useOrientation();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 820;
    const startTimeRef = useRef(Date.now());

    const handleVideoLoad = () => {
        setVideoReady(true);

        // Calculer le temps écoulé depuis le début
        const elapsedTime = Date.now() - startTimeRef.current;
        const minDisplayTime = 1000; // Temps minimum d'affichage du preloader (1 seconde pour Home)

        // Si le chargement est rapide, on attend au moins minDisplayTime
        // Sinon, on attend juste un peu pour que la vidéo soit prête
        const remainingTime = elapsedTime < minDisplayTime
            ? minDisplayTime - elapsedTime
            : 100; // 100ms supplémentaires si le chargement a pris plus de temps

        setTimeout(() => {
            setShowPreloader(false);
            // Afficher le contenu immédiatement après la disparition du preloader
            setLoading(false);
        }, remainingTime);
    };

    return (
        <div className="relative w-screen h-[100dvh] scrollbar-hide" style={{
            overflow: (isMobile && !isLandscape) ? 'hidden' : 'auto',
            overflowX: 'hidden'
        }}>
            {/* Preloader */}
            {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} duration={800} />}

            {/* Navbar avec marge top responsive */}
            <div className="relative z-[300] font-HelveticaNeue font-[400] text-custom-grey">
                <Navbar />
            </div>

            {/* Vidéo Vimeo */}
            <VideoPlayer onVideoLoad={handleVideoLoad} videoRef={videoRef} />

            {/* Contenu après chargement - toujours rendus mais cachés jusqu'à ce que loading soit false */}
            <EnterButton show={!loading} />
            <SoundButton videoRef={videoRef} show={!loading} />
        </div>
    );
};

export default Home;
