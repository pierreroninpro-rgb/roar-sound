import React, { useRef, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { gsap } from "gsap";
import Player from "@vimeo/player";
import { useOrientation } from "../hooks/useOrientation";

const Enter = () => {
  const overlayRef = useRef(null);
  const loaderRef = useRef([]);
  const videoRef = useRef(null);
  const enterButtonRef = useRef(null);
  const soundButtonRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSoundIcon, setShowSoundIcon] = useState(true);
  const isLandscape = useOrientation();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 820;


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
        ease: "power1.inOut",
      }
    );
  }, []);

  const handleVideoLoad = () => {
    setVideoReady(true);
    fadeOutLoader();
  };

  const handleSoundClick = () => {
    toggleMute();          // si tu veux quand même gérer le son
    setShowSoundIcon(false); // cache l’image après le clic
  };
  
  const fadeOutLoader = () => {
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 1,
      onComplete: () => setLoading(false),
    });

    gsap.to(videoRef.current, { opacity: 1, duration: 1 });

    gsap.fromTo(
      soundButtonRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 1, delay: 1 }
    );
    gsap.fromTo(
      enterButtonRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, delay: 1.3 }
    );
  };

  const toggleMute = async () => {
    const player = new Player(videoRef.current);
    if (isMuted) {
      await player.setMuted(false);
      await player.setVolume(1);
      setIsMuted(false);
    } else {
      await player.setMuted(true);
      await player.setVolume(0);
      setIsMuted(true);
    }

    gsap.fromTo(
      soundButtonRef.current,
      { scale: 1.2 },
      { scale: 1, duration: 0.2, ease: "power1.out" }
    );
  };

  return (
    <div className="relative w-screen h-[100dvh] scrollbar-hide homet greyh" style={{
      overflow: (isMobile && !isLandscape) ? 'hidden' : 'auto',
      overflowX: 'hidden'
    }}>
      {/* ✅ Navbar avec marge top responsive */}
      
      <div className="pt-roar-y-mobile md:pt-roar-y-desktop relative z-[300]">
        <Navbar />
      </div>

      {/* Vidéo Vimeo - FULLSCREEN sans marges */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <iframe
          ref={videoRef}
          loading="lazy"
          onLoad={handleVideoLoad}
          src="https://player.vimeo.com/video/1128797324?autoplay=1&loop=1&muted=1&background=1&quality=360p"
          className="absolute w-[450%] h-[130%] -translate-x-3/4 scale-125 top-0 left-0 md:w-[120%] md:h-[120%] md:-translate-x-1/2 md:-translate-y-1/2 md:scale-125"
          style={{ transform: "translate(-10%, -10%) scale(1.2)", opacity: 0 }}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Vidéo d'accueil"
        />
      </div>

      {/* Loader */}
      {loading && (
        <div
          ref={overlayRef}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50 "
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
      )}

      {/* Contenu central */}
      {!loading && (
        <>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <button
              ref={enterButtonRef}
              className="font-Helvetica_Neue font-[400] text-[16px] md:text-[38px] greyh"
              onClick={() => (window.location.href = "/Home")}
            >
              Enter
            </button>
          </div>

          {/* ✅ Bouton Son - Dimensions et marges exactes Figma */}
          {/* Mobile: mb=4.13px, Logo=52x52px | Desktop: mb=7.7px, Logo=75x75px */}
          {/* <div 
            className="absolute z-[100] pointer-events-auto"
            style={{
              bottom: 'max(4.13px, env(safe-area-inset-bottom))',
              right: '0'
            }}
          >
            <button
              ref={soundButtonRef}
              onClick={toggleMute}
              className="text-lg text-white transition-all duration-300 font-HelveticaNeue block md:mr-[36px]"
              style={{
                marginBottom: '4.13px'
              }}
            >
              <img
                src={isMuted ? "/images/soundoff.png" : "/images/soundon.png"}
                alt={isMuted ? "Sound Off" : "Sound On"}
                className="w-[52px] h-[52px] md:w-[75px] md:h-[75px]"
                style={{
                  marginBottom: window.innerWidth >= 768 ? '7.7px' : '4.13px'
                }}
              />
            </button>
          </div> */}
          {showSoundIcon && (
  <div 
    className="absolute z-[100] pointer-events-auto"
    style={{
      bottom: 'max(4.13px, env(safe-area-inset-bottom))',
      right: '0'
    }}
  >
    <button
      ref={soundButtonRef}
      onClick={handleSoundClick}
      className="text-lg text-white transition-all duration-300 font-HelveticaNeue block md:mr-[36px]"
      style={{ marginBottom: '4.13px' }}
    >
      <img
        src="/images/soundoff.png"
        alt="Sound Off"
        className="w-[52px] h-[52px] md:w-[75px] md:h-[75px]"
      />
    </button>
  </div>
)}

        </>
      )}
    </div>
  );
};
