import React, { useRef, useState, useEffect } from 'react';
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

    useEffect(() => {
        // Le preloader dure 4 secondes
        const timer = setTimeout(() => {
            setShowPreloader(false);
            // Afficher la vidéo et le contenu après la disparition du preloader
            if (videoRef.current) {
                gsap.set(videoRef.current, { opacity: 1 });
            }
            setLoading(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    const handleVideoLoad = () => {
        setVideoReady(true);
        // La vidéo est chargée, mais on attend que le preloader se termine (5 secondes)
    };

    return (
        <div className="relative w-screen h-[100dvh] scrollbar-hide" style={{
            overflow: (isMobile && !isLandscape) ? 'hidden' : 'auto',
            overflowX: 'hidden'
        }}>
            {/* Preloader */}
            {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} duration={4000} />}

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
