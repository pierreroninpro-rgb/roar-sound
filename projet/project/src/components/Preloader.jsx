import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

const Preloader = ({ onComplete, duration = 500 }) => {
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(0.7); // Commence petit
  const loaderRef = useRef([]);

  useEffect(() => {
    // Animation d'agrandissement jusqu'à 30% de plus (1.3)
    setTimeout(() => {
      setScale(1.3);
    }, 50);

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
  }, [onComplete, duration]);

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
        {/* Conteneur du logo avec zoom */}
        <div
          style={{
            position: 'relative',
            width: '150px',
            height: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${scale})`,
            transition: 'transform 0.35s ease-out'
          }}
        >
          {/* Image ROAR.jpg sans rotation */}
          <img
            src="/ROAR.jpg"
            alt="ROAR"
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
            gap: '8px',
            marginTop: '3px',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              ref={(el) => (loaderRef.current[i] = el)}
              style={{
                width: '12px',
                height: '12px',
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
