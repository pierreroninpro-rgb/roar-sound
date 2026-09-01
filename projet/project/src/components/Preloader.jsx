import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

const Preloader = ({ onComplete, duration = 500 }) => {
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(0.7); // Commence petit
  const [isMobile, setIsMobile] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false); // Masqué au 1er rendu pour éviter le flash en haut à gauche sur Firefox
  const loaderRef = useRef([]);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 820);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Attendre que le layout soit appliqué (évite le flash du logo en haut à gauche sur Firefox)
    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setLogoVisible(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!logoVisible) return;
    // Animation d'agrandissement jusqu'à 30% de plus (1.3)
    const t = setTimeout(() => {
      setScale(1.3);
    }, 50);
    return () => clearTimeout(t);
  }, [logoVisible]);

  useEffect(() => {
    if (!logoVisible) return;

    // Animation des points de chargement
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

    // Animation de fade out après la durée spécifiée
    const timer = setTimeout(() => {
      setOpacity(0);
      // Attendre la fin de l'animation avant d'appeler onComplete
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300); // Durée de l'animation de fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration, logoVisible]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#F6F6F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: opacity,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: opacity === 0 ? 'none' : 'auto'
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Conteneur du logo avec zoom (invisible au 1er rendu pour Firefox) */}
        <div
          style={{
            position: 'relative',
            width: isMobile ? '75px' : '150px',
            height: isMobile ? '75px' : '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${scale})`,
            transition: 'transform 0.35s ease-out',
            opacity: logoVisible ? 1 : 0,
            transition: 'transform 0.35s ease-out, opacity 0.15s ease-out'
          }}
        >
          {/* Image ROAR.jpg sans rotation */}
          <img
            src="/ROAR.jpg"
            alt="Roar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Points de chargement à 3px en dessous du logo */}
        <div
          style={{
            display: 'flex',
            gap: isMobile ? '4px' : '8px',
            marginTop: isMobile ? '1.5px' : '3px',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              ref={(el) => (loaderRef.current[i] = el)}
              style={{
                width: isMobile ? '6px' : '12px',
                height: isMobile ? '6px' : '12px',
                borderRadius: '50%',
                backgroundColor: '#000'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Preloader;
