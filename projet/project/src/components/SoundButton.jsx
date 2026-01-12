import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import Player from '@vimeo/player';

const SoundButton = ({ videoRef, show }) => {
  const soundButtonRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showSoundIcon, setShowSoundIcon] = useState(true);

  useEffect(() => {
    if (show && soundButtonRef.current) {
      // S'assurer que le bouton est initialement invisible
      gsap.set(soundButtonRef.current, { opacity: 0, y: -10 });
      // Animer immédiatement sans délai pour éviter la page blanche
      gsap.to(soundButtonRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0,
      });
    }
  }, [show]);

  const toggleMute = async () => {
    if (!videoRef?.current) return;

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

    // Animation de scale supprimée pour éviter les effets hover
  };

  const handleSoundClick = () => {
    toggleMute();
    setShowSoundIcon(false);
  };

  if (!show || !showSoundIcon) return null;

  return (
    <div
      className="absolute z-[100] pointer-events-auto"
      style={{
        bottom: 'max(4.13px, env(safe-area-inset-bottom))',
        right: '0',
      }}
    >
      <button
        ref={soundButtonRef}
        onClick={handleSoundClick}
        className="text-lg text-white font-HelveticaNeue block md:mr-[22px] cursor-pointer"
        style={{ 
          marginBottom: '4.13px',
          transition: 'none',
          transform: 'none',
          pointerEvents: 'auto'
        }}
      >
        <img
          src="/images/soundoff.png"
          alt="Sound Off"
          className="w-[52px] h-[52px] md:w-[75px] md:h-[75px]"
        />
      </button>
    </div>
  );
};

export default SoundButton;
