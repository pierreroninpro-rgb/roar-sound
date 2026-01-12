import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import VideoList from '../components/VideoList.jsx';
import { useOrientation } from '../hooks/useOrientation';

const Projects = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const isLandscape = useOrientation();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 820;

    return (
        <div className="w-full h-screen scrollbar-hide md:mb-[32px]" style={{ 
            backgroundColor: '#F6F6F6',
            overflow: (isMobile && !isLandscape) ? 'hidden' : 'auto',
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
    );
};

export default Projects;