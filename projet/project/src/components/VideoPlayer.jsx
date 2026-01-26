import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const VideoPlayer = ({ onVideoLoad, videoRef }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Synchroniser la ref parent avec la ref locale de l'iframe
    if (videoRef) {
      videoRef.current = iframeRef.current;
    }
  }, [videoRef]);

  const handleLoad = () => {
    if (iframeRef.current) {
      gsap.to(iframeRef.current, { opacity: 1, duration: 1 });
    }
    // Notifier le parent que la vidéo est chargée
    if (onVideoLoad) {
      onVideoLoad();
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
      <iframe
        ref={iframeRef}
        onLoad={handleLoad}
        src="https://player.vimeo.com/video/1151588642?autoplay=1&loop=1&muted=1&background=1&quality=1080p"
        className="absolute top-1/2 left-1/2"
        style={{
          width: 'max(100vw, 177.78vh)', // Prend la plus grande valeur pour couvrir tout l'écran
          height: 'max(100vh, 56.25vw)', // Prend la plus grande valeur pour couvrir tout l'écran
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          backgroundColor: '#F6F6F6', // Fond de la même couleur que le preloader pour éviter le blanc
        }}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        title="Vidéo d'accueil"
      />
    </div>
  );
};

export default VideoPlayer;
