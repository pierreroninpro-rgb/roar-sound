import React, { useRef, useState } from 'react';
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
    const [videoReady, setVideoReady] = useState(false);
    const isLandscape = useOrientation();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 820;

    const handleVideoLoad = () => {
        setVideoReady(true);
        fadeOutLoader();
    };

    const fadeOutLoader = () => {
        gsap.to(overlayRef.current, {
            opacity: 0,
            duration: 1,
            onComplete: () => setLoading(false),
        });
    };

    return (
        <div className="relative w-screen h-[100dvh] scrollbar-hide" style={{
            overflow: (isMobile && !isLandscape) ? 'hidden' : 'auto',
            overflowX: 'hidden'
        }}>
            {/* Navbar avec marge top responsive */}
            <div className="relative z-[300] font-HelveticaNeue font-[400] text-custom-grey">
                <Navbar />
            </div>

            {/* Vidéo Vimeo */}
            <VideoPlayer onVideoLoad={handleVideoLoad} videoRef={videoRef} />

            {/* Loader */}
            {loading && <LoaderHome overlayRef={overlayRef} />}

            {/* Contenu après chargement - toujours rendus mais cachés jusqu'à ce que loading soit false */}
            <EnterButton show={!loading} />
            <SoundButton videoRef={videoRef} show={!loading} />
        </div>
    );
};

export default Home;
