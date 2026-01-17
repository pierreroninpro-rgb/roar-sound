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

    return (
        <>
            {isLoading && <Preloader onComplete={() => setIsLoading(false)} duration={500} />}
            <div className="w-full h-screen scrollbar-hide md:mb-[32px]" style={{ 
                backgroundColor: '#F6F6F6',
                overflow: (isMobile && isLandscape) ? 'hidden' : (isMobile && !isLandscape) ? 'hidden' : 'auto', // Cacher le scroll en mobile (portrait et paysage)
                overflowX: 'hidden'
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