import React, { useEffect, useState } from 'react';

const Preloader = ({ onComplete }) => {
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(0.7); // Commence petit

  useEffect(() => {
    // Animation d'agrandissement jusqu'à 30% de plus (1.3)
    setTimeout(() => {
      setScale(1.3);
    }, 50);

    // Animation de fade out après 0.5 secondes
    const timer = setTimeout(() => {
      setOpacity(0);
      // Attendre la fin de l'animation avant d'appeler onComplete
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300); // Durée de l'animation de fade out
    }, 500);

    return () => clearTimeout(timer);
  }, [onComplete]);

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
    </div>
  );
};

export default Preloader;
