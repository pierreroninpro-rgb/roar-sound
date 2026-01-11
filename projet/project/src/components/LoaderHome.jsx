import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const LoaderHome = ({ overlayRef }) => {
    const loaderRef = useRef([]);

    useEffect(() => {
        gsap.fromTo(
            loaderRef.current,
            { scale: 0, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                stagger: 0.1,
                yoyo: true,
                repeat: -1,
                duration: 0.6,
                ease: 'power1.inOut',
            }
        );
    }, []);

    return (
        <div
            ref={overlayRef}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50"
        >
            <div className="flex space-x-2">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        ref={(el) => (loaderRef.current[i] = el)}
                        className="w-4 h-4 rounded-full bg-white"
                    />
                ))}
            </div>
        </div>
    );
};

export default LoaderHome;
