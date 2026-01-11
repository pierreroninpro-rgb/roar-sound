import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import VideoList from '../components/VideoList.jsx';

const Projects = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <div className="w-full h-screen overflow-hidden scrollbar-hide md:mb-[32px]" style={{ backgroundColor: '#F6F6F6' }}>
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