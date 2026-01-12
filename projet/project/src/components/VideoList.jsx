import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Player from "@vimeo/player";
import Carousel from "./Carrousel.jsx";

// Dimensions de référence (comme Figma)
const BASE_WIDTH_MOBILE = 390;
const BASE_WIDTH_DESKTOP = 1440;

// Valeurs de référence en px (basées sur le design Figma)
const REFERENCE_VALUES = {
  mobile: {
    navbarSpacing: 0, // Fixe - Réduit pour mobile (était 41)
    videoSpacing: 80, // Fixe
    horizontalMargin: 15, // Fixe
    bottomMargin: 18 // Marge en bas fixe
  },
  desktop: {
    navbarSpacing: 17, // Fixe
    videoSpacing: 25, // Fixe (espacement après la vidéo)
    horizontalMargin: 46, // Fixe
    videoHeight: 392, // Proportionnel - Hauteur du lecteur vidéo
    bottomMargin: 17 // Marge en bas fixe (identique à navbarSpacing pour symétrie)
  }
};

export default function VideoList({ onFullscreenChange }) {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // État pour la barre de progression
  const [isFullscreen, setIsFullscreen] = useState(false); // État pour détecter le plein écran
  const [showControls, setShowControls] = useState(false); // État pour afficher/masquer les contrôles au clic
  const [isHovering, setIsHovering] = useState(false); // État pour détecter le hover
  const [isMuted, setIsMuted] = useState(false); // État pour le son
  const [fullscreenVideoDimensions, setFullscreenVideoDimensions] = useState({ width: '100vw', height: '100vh' }); // Dimensions pour letterboxing en plein écran
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const videoContainerRef = useRef(null); // Référence pour le conteneur vidéo
  const controlsTimeoutRef = useRef(null); // Référence pour le timeout de masquage des contrôles

  // État pour les dimensions (marges fixes, vidéo proportionnelle)
  const [spacing, setSpacing] = useState({
    navbarSpacing: 41,
    videoSpacing: 80,
    carouselSpacing: 80,
    horizontalMargin: 15,
    videoHeight: 210, // Hauteur de la vidéo (proportionnelle)
    bottomMargin: 18, // Marge en bas (fixe)
    isMobile: false, // État pour savoir si on est en mobile
    isTablet: false, // État pour savoir si on est en tablette
    isTabletLarge: false, // État pour savoir si on est en tablette large (7 images)
    openIconWidth: 20, // Taille responsive de l'icône open
    openIconHeight: 20, // Taille responsive de l'icône open
    titleFontSize: 12, // Taille de police responsive pour le titre
    subtitleFontSize: 12, // Taille de police responsive pour le sous-titre
    descriptionFontSize: 12 // Taille de police responsive pour la description
  });

  // Calcul des dimensions proportionnelles basées sur la largeur réelle du conteneur
  useEffect(() => {
    const calculateSpacing = () => {
      // Utiliser window.innerWidth pour être cohérent avec le carrousel
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth;
      const containerWidth = containerRef.current ? containerRef.current.getBoundingClientRect().width : null;

      const isMobile = screenWidth <= 820; // Même breakpoint que le carrousel
      const isTablet = screenWidth > 820 && screenWidth < 1024; // Tablette : entre 820px et 1024px
      const isTabletLarge = screenWidth >= 900 && screenWidth < 1024; // Zone tablette large avec 7 images

      const baseWidth = isMobile ? BASE_WIDTH_MOBILE : BASE_WIDTH_DESKTOP;
      const scaleRatio = screenWidth / baseWidth;
      const refValues = isMobile ? REFERENCE_VALUES.mobile : REFERENCE_VALUES.desktop;

      // Calculer la hauteur de la vidéo de manière progressive
      // Sur les très grands écrans, augmenter progressivement
      let videoHeight;
      let carouselSpacing;
      let bottomMarginFixed;

      if (isMobile) {
        // Augmenter la hauteur de la vidéo en mobile pour qu'elle soit plus grande
        videoHeight = 220 * scaleRatio; // Augmenté de 154 à 180
        carouselSpacing = refValues.videoSpacing; // Fixe pour mobile
        bottomMarginFixed = refValues.bottomMargin; // Fixe pour mobile (18px)
      } else {
        // Pour desktop : adapter les espacements pour que tout tienne dans 100vh
        const navbarHeight = 12 + 60; // margin-top + hauteur navbar approximative
        const carouselWithTitle = 250; // Hauteur approximative du carrousel avec titres (image + titre)
        const baseBottomMargin = refValues.bottomMargin; // Marge de base (28px desktop, 18px mobile)
        const baseCarouselSpacing = refValues.videoSpacing; // Espacement de base (25px desktop, 80px mobile)

        // Calculer l'espace vertical disponible après la navbar
        const spaceAfterNavbar = screenHeight - navbarHeight - refValues.navbarSpacing;

        // Valeurs minimales pour éviter que les éléments soient trop serrés
        const minBottomMargin = 10;
        const minCarouselSpacing = isTablet ? 0 : 15;

        // Calculer l'espace nécessaire pour le carrousel et les marges
        const totalFixedHeight = carouselWithTitle + minBottomMargin + minCarouselSpacing;
        const availableSpaceForMarges = Math.max(0, spaceAfterNavbar - totalFixedHeight);

        // Répartir l'espace disponible proportionnellement, en privilégiant légèrement le carouselSpacing
        let adaptiveBottomMargin = minBottomMargin;
        let adaptiveCarouselSpacing = minCarouselSpacing;

        if (isTabletLarge) {
          // En tablette large (7 images) : réduire les marges pour libérer de l'espace
          adaptiveCarouselSpacing = Math.max(minCarouselSpacing, baseCarouselSpacing - 18);
          adaptiveBottomMargin = Math.max(minBottomMargin, baseBottomMargin - 18);
        } else if (isTablet) {
          // En tablette normale (5 images) : pas d'espacement vidéo-carrousel, réduire la marge en bas
          adaptiveCarouselSpacing = 0;
          adaptiveBottomMargin = Math.max(minBottomMargin, baseBottomMargin - 18);
        } else {
          // Desktop : utiliser les valeurs de base mais adapter si nécessaire
          adaptiveCarouselSpacing = baseCarouselSpacing;
          adaptiveBottomMargin = baseBottomMargin;
        }

        // Si l'espace disponible est insuffisant, réduire les marges de manière adaptative
        const requiredHeight = carouselWithTitle + adaptiveCarouselSpacing + adaptiveBottomMargin;
        if (requiredHeight > spaceAfterNavbar) {
          // Calculer le ratio de réduction nécessaire
          const reductionRatio = spaceAfterNavbar / requiredHeight;
          adaptiveCarouselSpacing = Math.max(minCarouselSpacing, adaptiveCarouselSpacing * reductionRatio);
          adaptiveBottomMargin = Math.max(minBottomMargin, adaptiveBottomMargin * reductionRatio);
        }

        carouselSpacing = adaptiveCarouselSpacing;
        bottomMarginFixed = adaptiveBottomMargin;

        if ((isTablet && !isTabletLarge) || isTabletLarge) {
          // En tablette normale (5 images) et tablette large (7 images) : réduire la hauteur de la vidéo pour libérer de l'espace
          // Calculer l'espace disponible en tenant compte du carrousel et des marges
          const fixedHeight = navbarHeight + refValues.navbarSpacing + carouselSpacing + carouselWithTitle + bottomMarginFixed;
          const availableHeightForVideo = screenHeight - fixedHeight;

          // Réduire la vidéo à 70% de l'espace disponible pour laisser de la place au carrousel
          videoHeight = availableHeightForVideo * 0.7;

          // S'assurer d'avoir au moins une hauteur minimale raisonnable (mais pas plus que l'espace disponible)
          const minVideoHeightTablet = refValues.videoHeight * 0.4; // Minimum 40% de la hauteur de référence
          videoHeight = Math.max(videoHeight, minVideoHeightTablet);
          videoHeight = Math.min(videoHeight, availableHeightForVideo * 0.75); // Maximum 75% de l'espace disponible
        } else if (!isTablet) {
          // Calculer l'espace disponible pour la vidéo (desktop uniquement)
          // Hauteur totale utilisée = navbar + navbarSpacing + carouselSpacing + carousel + bottomMargin
          const fixedHeight = navbarHeight + refValues.navbarSpacing + carouselSpacing + carouselWithTitle + bottomMarginFixed;
          const availableHeightForVideo = screenHeight - fixedHeight;

          // La vidéo doit s'adapter à l'espace disponible sans dépasser
          // Pour que le carrousel reste toujours visible, la vidéo ne doit jamais dépasser l'espace disponible
          // Utiliser directement l'espace disponible (la vidéo sera plus petite si nécessaire)
          videoHeight = availableHeightForVideo;
        }
      }

      // Réduire la hauteur de la vidéo de 15% puis agrandir de 5% puis augmenter de 5% puis augmenter de 2%
      videoHeight = videoHeight * 0.85 * 1.05 * 1.05 * 1.02;

      // Taille de l'icône open responsive (proportionnelle)
      const openIconBaseWidth = 20; // Taille de base sur desktop
      const openIconBaseHeight = 20; // Taille de base sur desktop
      const openIconWidth = isMobile ? openIconBaseWidth * scaleRatio : openIconBaseWidth;
      const openIconHeight = isMobile ? openIconBaseHeight * scaleRatio : openIconBaseHeight;

      // Tailles de police responsive pour la tablette large (7 images) et tablette normale (5 images)
      const baseTitleFontSize = 20; // 1.25rem = 20px en base
      const baseSubtitleFontSize = 20; // 1.25rem = 20px en base
      const baseDescriptionFontSize = 20; // 1.25rem = 20px en base

      let titleFontSize = 12; // Par défaut mobile
      let subtitleFontSize = 12; // Par défaut mobile
      let descriptionFontSize = 12; // Par défaut mobile

      if (isTabletLarge || (isTablet && !isTabletLarge)) {
        // Pour tablette (5 et 7 images, 820px-1024px), utiliser scaleRatio pour rendre responsive
        titleFontSize = baseTitleFontSize * scaleRatio;
        subtitleFontSize = baseSubtitleFontSize * scaleRatio;
        descriptionFontSize = baseDescriptionFontSize * scaleRatio;
      } else if (!isMobile && !isTablet) {
        // Pour desktop, taille fixe
        titleFontSize = baseTitleFontSize;
        subtitleFontSize = baseSubtitleFontSize;
        descriptionFontSize = baseDescriptionFontSize;
      }

      // En desktop, forcer la marge inférieure à être égale à la marge supérieure de la navbar pour symétrie
      if (!isMobile && !isTablet) {
        bottomMarginFixed = refValues.navbarSpacing;
      }

      const newSpacing = {
        navbarSpacing: refValues.navbarSpacing, // Fixe - ne change pas avec l'écran
        videoSpacing: refValues.videoSpacing, // Fixe - ne change pas avec l'écran
        carouselSpacing: carouselSpacing, // Fixe pour desktop, variable pour mobile
        horizontalMargin: refValues.horizontalMargin, // Fixe - ne change pas avec l'écran
        videoHeight: videoHeight, // Adaptatif pour remplir l'espace disponible
        bottomMargin: bottomMarginFixed, // Fixe - marge en bas constante (18px mobile, 17px desktop = navbarSpacing)
        isMobile: isMobile, // État mobile pour le rendu
        isTablet: isTablet, // État tablette pour le rendu
        isTabletLarge: isTabletLarge, // État tablette large (7 images) pour le rendu
        openIconWidth: openIconWidth, // Taille responsive de l'icône open
        openIconHeight: openIconHeight, // Taille responsive de l'icône open
        titleFontSize: titleFontSize, // Taille de police responsive pour le titre
        subtitleFontSize: subtitleFontSize, // Taille de police responsive pour le sous-titre
        descriptionFontSize: descriptionFontSize // Taille de police responsive pour la description
      };

      // Logs de débogage
      console.log('=== VideoList Spacing Calculation ===');
      console.log('screenWidth (clientWidth):', screenWidth);
      console.log('window.innerWidth:', windowWidth);
      console.log('containerRef width:', containerWidth);
      console.log('isMobile:', isMobile);
      console.log('baseWidth:', baseWidth);
      console.log('scaleRatio:', scaleRatio);
      console.log('refValues:', refValues);
      console.log('newSpacing:', newSpacing);
      console.log('Détails newSpacing:', {
        navbarSpacing: `${newSpacing.navbarSpacing.toFixed(2)}px`,
        videoSpacing: `${newSpacing.videoSpacing.toFixed(2)}px`,
        horizontalMargin: `${newSpacing.horizontalMargin.toFixed(2)}px`,
        videoHeight: `${newSpacing.videoHeight.toFixed(2)}px`
      });
      console.log('===================================');

      setSpacing(newSpacing);
    };

    // Calculer immédiatement et après le montage
    calculateSpacing();

    // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
    const rafId = requestAnimationFrame(() => {
      calculateSpacing();
    });

    window.addEventListener('resize', calculateSpacing);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', calculateSpacing);
    };
  }, []);

  // Fetch videos from the server
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/videos.json");
        if (!response.ok) throw new Error("Failed to fetch videos.");
        const data = await response.json();

        const processedData = data.map((video) => {
          let videoUrl = video.url || video.video;
          if (videoUrl?.includes("vimeo.com/") && !videoUrl.includes("player.vimeo.com")) {
            const videoId = videoUrl.split("vimeo.com/")[1];
            videoUrl = `https://player.vimeo.com/video/${videoId}`;
          }
          return { ...video, url: videoUrl };
        });

        setVideos(processedData);
        setSelectedVideo(processedData[0]);
      } catch (err) {
        console.error("Error loading videos:", err);
        setError(err.message);
      }
    };

    fetchVideos();
  }, []);

  // Initialize Vimeo Player when video changes
  useEffect(() => {
    if (videoRef.current && selectedVideo) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error("Error destroying player:", err);
        }
      }

      setTimeout(async () => {
        if (videoRef.current) {
          playerRef.current = new Player(videoRef.current);
          setIsPlaying(false);

          // Listen to timeupdate events for progress
          playerRef.current.on("timeupdate", async (data) => {
            try {
              const duration = await playerRef.current.getDuration();
              if (duration && duration > 0) {
                setProgress((data.seconds / duration) * 100);
              }
            } catch (err) {
              console.error("Error updating progress:", err);
            }
          });

          // Listen to play/pause events
          playerRef.current.on("play", () => {
            setIsPlaying(true);
            // Masquer les contrôles après 3 secondes seulement si on ne survole pas
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
            if (!isHovering) {
              controlsTimeoutRef.current = setTimeout(() => {
                if (!isHovering) {
                  setShowControls(false);
                }
              }, 3000);
            }
          });
          playerRef.current.on("pause", () => {
            setIsPlaying(false);
            // Garder les contrôles visibles quand on pause
            setShowControls(true);
          });
          playerRef.current.on("ended", () => {
            setIsPlaying(false); // Réafficher le bouton play quand la vidéo est finie
            setShowControls(true); // Afficher les contrôles à la fin
          });

          // Vérifier l'état initial du volume
          try {
            const volume = await playerRef.current.getVolume();
            setIsMuted(volume === 0);
          } catch (err) {
            console.error("Error getting volume:", err);
          }
        }
      }, 100);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error("Error in cleanup:", err);
        }
        playerRef.current = null;
      }
    };
  }, [selectedVideo]);

  const handlePlayPause = async () => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        await playerRef.current.pause();
      } else {
        await playerRef.current.play();
      }
    } catch (err) {
      console.error("Error controlling video:", err);
    }
  };

  const handleFullscreen = async () => {
    const container = videoContainerRef.current;
    if (!container) return;

    try {
      if (isFullscreen) {
        // Sortir du plein écran
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsFullscreen(false);
        if (onFullscreenChange) onFullscreenChange(false);
      } else {
        // Entrer en plein écran sur notre conteneur (pas via Vimeo)
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          await container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen();
        }
        setIsFullscreen(true);
        if (onFullscreenChange) onFullscreenChange(true);
        // Calculer les dimensions pour letterboxing
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = 16 / 9;

        let iframeWidth, iframeHeight;

        // Si l'écran est plus large que le ratio 16:9, on limite par la hauteur
        if (screenWidth / screenHeight > aspectRatio) {
          iframeHeight = screenHeight;
          iframeWidth = screenHeight * aspectRatio;
        } else {
          // Sinon, on limite par la largeur
          iframeWidth = screenWidth;
          iframeHeight = screenWidth / aspectRatio;
        }

        setFullscreenVideoDimensions({
          width: `${iframeWidth}px`,
          height: `${iframeHeight}px`
        });
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  // Écouter les changements de plein écran et gérer les événements en mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      const isCurrentlyFullscreen = !!fullscreenElement;

      // Vérifier que c'est bien notre conteneur vidéo qui est en plein écran
      const isOurContainer = fullscreenElement === videoContainerRef.current;

      setIsFullscreen(isCurrentlyFullscreen && isOurContainer);
      if (onFullscreenChange) onFullscreenChange(isCurrentlyFullscreen && isOurContainer);
      // Forcer l'affichage des contrôles quand on entre/sort du plein écran
      if (isCurrentlyFullscreen && isOurContainer) {
        setShowControls(true);
        setIsHovering(true);
        // Calculer les dimensions pour letterboxing
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = 16 / 9;

        let iframeWidth, iframeHeight;

        // Si l'écran est plus large que le ratio 16:9, on limite par la hauteur
        if (screenWidth / screenHeight > aspectRatio) {
          iframeHeight = screenHeight;
          iframeWidth = screenHeight * aspectRatio;
        } else {
          // Sinon, on limite par la largeur
          iframeWidth = screenWidth;
          iframeHeight = screenWidth / aspectRatio;
        }

        setFullscreenVideoDimensions({
          width: `${iframeWidth}px`,
          height: `${iframeHeight}px`
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Gérer les événements en mode plein écran (clic et mouvement de souris)
  useEffect(() => {
    if (!isFullscreen) return;

    // Gérer les clics sur le document en mode plein écran
    const handleFullscreenClick = async (e) => {
      // Ignorer les clics sur la navbar, les boutons play/pause, et leurs parents
      const navbar = document.querySelector('[data-fullscreen-navbar]');
      const playButton = e.target.closest('button[data-fullscreen-play]');
      const pauseButton = e.target.closest('button[data-fullscreen-pause]');

      if ((navbar && navbar.contains(e.target)) || playButton || pauseButton) {
        return;
      }

      // Ignorer les clics sur les images (boutons play/pause)
      if (e.target.tagName === 'IMG' && (e.target.alt === 'Play' || e.target.alt === 'Pause')) {
        return;
      }

      // Toggle play/pause
      if (playerRef.current) {
        setShowControls(true);
        setIsHovering(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }

        try {
          if (isPlaying) {
            await playerRef.current.pause();
            setIsPlaying(false);
            setShowControls(true);
          } else {
            await playerRef.current.play();
            setIsPlaying(true);
            controlsTimeoutRef.current = setTimeout(() => {
              setIsHovering(false);
              setShowControls(false);
            }, 3000);
          }
        } catch (err) {
          console.error("Error toggling play/pause:", err);
        }
      }
    };

    // Gérer les mouvements de souris en mode plein écran
    const handleFullscreenMouseMove = () => {
      setShowControls(true);
      setIsHovering(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setIsHovering(false);
          setShowControls(false);
        }, 3000);
      }
    };

    document.addEventListener('click', handleFullscreenClick);
    document.addEventListener('mousemove', handleFullscreenMouseMove);

    return () => {
      document.removeEventListener('click', handleFullscreenClick);
      document.removeEventListener('mousemove', handleFullscreenMouseMove);
    };
  }, [isFullscreen, isPlaying, isHovering]);

  // Gérer le hover sur la vidéo
  const handleVideoMouseEnter = () => {
    setIsHovering(true);
    setShowControls(true);
    // Annuler le timeout quand on entre
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleVideoMouseLeave = () => {
    // Masquer les contrôles seulement si la vidéo joue
    if (isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      // Petit délai avant de vérifier si on est toujours en train de survoler la navbar
      controlsTimeoutRef.current = setTimeout(() => {
        // Vérifier qu'on n'est toujours pas en train de survoler
        if (!isHovering) {
          setShowControls(false);
        }
      }, 1000); // Délai de 1 seconde
    }
    // Mettre à jour isHovering après un petit délai pour permettre le passage vers la navbar
    setTimeout(() => {
      setIsHovering(false);
    }, 100);
  };

  // Gérer le hover sur la navbar pour la garder visible
  const handleNavbarMouseEnter = () => {
    setIsHovering(true);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleNavbarMouseLeave = () => {
    setIsHovering(false);
    // Masquer les contrôles seulement si la vidéo joue
    if (isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
  };

  // Gérer le clic sur l'écran pour play/pause
  const handleVideoClick = async () => {
    if (!playerRef.current) return;

    // Afficher les contrôles au clic
    setShowControls(true);
    setIsHovering(true);

    // Annuler le timeout précédent si il existe
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    try {
      if (isPlaying) {
        await playerRef.current.pause();
        setIsPlaying(false);
        // Si on met en pause, garder les contrôles visibles
        setShowControls(true);
      } else {
        await playerRef.current.play();
        setIsPlaying(true);
        // Si on joue, masquer les contrôles après 3 secondes seulement si on ne survole pas
        if (!isHovering) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Error toggling play/pause:", err);
    }
  };

  // Gérer le toggle du son
  const handleToggleMute = async (e) => {
    e?.stopPropagation();
    if (!playerRef.current) return;

    try {
      if (isMuted) {
        await playerRef.current.setVolume(1);
        setIsMuted(false);
      } else {
        await playerRef.current.setVolume(0);
        setIsMuted(true);
      }
      // Réafficher les contrôles quand on change le son
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error toggling mute:", err);
    }
  };

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Log de l'état actuel du spacing avec détails
  console.log('VideoList render - current spacing state:', {
    navbarSpacing: `${spacing.navbarSpacing.toFixed(2)}px`,
    videoSpacing: `${spacing.videoSpacing.toFixed(2)}px`,
    horizontalMargin: `${spacing.horizontalMargin.toFixed(2)}px`,
    videoHeight: `${spacing.videoHeight.toFixed(2)}px`
  });

  return (
    <div
      ref={containerRef}
      className="w-full max-w-full"
      style={{
        boxSizing: 'border-box',
        overflow: 'hidden', // Pas de scroll
        paddingBottom: isFullscreen ? '0' : `${spacing.bottomMargin}px`, // Marge en bas fixe (18px mobile, 28px desktop)
        paddingLeft: isFullscreen ? '0' : undefined,
        paddingRight: isFullscreen ? '0' : undefined,
        paddingTop: isFullscreen ? '0' : undefined,
        margin: isFullscreen ? '0' : undefined,
        height: '100vh', // Hauteur totale de la fenêtre
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        position: 'relative'
      }}
    >
      {error ? (
        <div className="text-red-500 text-center">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Espacement Navbar → Video - proportionnel */}
          {!isFullscreen && (
            <div
              style={{
                height: `${spacing.navbarSpacing}px`,
                backgroundColor: 'transparent' // Pour forcer l'application du style
              }}
              data-debug-spacing={spacing.navbarSpacing}
            />
          )}

          <div
            className="source-sans-light flex w-full"
            style={{
              flexDirection: spacing.isMobile ? 'column' : 'row',
              gap: spacing.isMobile ? '0' : '1.5rem',
              alignItems: spacing.isMobile ? 'stretch' : 'flex-start',
              paddingLeft: (spacing.isMobile || isFullscreen) ? '0' : `${spacing.horizontalMargin}px`,
              paddingRight: (spacing.isMobile || isFullscreen) ? '0' : `${spacing.horizontalMargin}px`,
              boxSizing: 'border-box' // Inclure le padding dans la largeur totale
            }}
            data-debug-margin={spacing.horizontalMargin}
          >
            {/* Player principal */}
            <div
              className="md:border-none relative flex-shrink-0"
              style={{
                width: '100%',
                maxWidth: spacing.isMobile ? '100%' : `${(spacing.videoHeight * 16) / 9}px`,
                paddingLeft: isFullscreen ? '0' : (spacing.isMobile ? `${spacing.horizontalMargin}px` : '0'),
                paddingRight: isFullscreen ? '0' : (spacing.isMobile ? `${spacing.horizontalMargin}px` : '0'),
                boxSizing: 'border-box',
                position: 'relative', // S'assurer que le positionnement absolu des enfants fonctionne
                margin: isFullscreen ? '0' : undefined
              }}
            >
              {selectedVideo && selectedVideo.url ? (
                <>
                  <div
                    ref={videoContainerRef}
                    className="overflow-hidden roar-blue relative w-full cursor-pointer"
                    style={{
                      height: isFullscreen ? '100vh' : `${spacing.videoHeight}px`,
                      width: isFullscreen ? '100vw' : '100%',
                      maxWidth: isFullscreen ? '100vw' : (spacing.isMobile ? '100%' : `${(spacing.videoHeight * 16) / 9}px`),
                      boxSizing: 'border-box',
                      position: 'relative',
                      backgroundColor: isFullscreen ? '#000' : 'transparent',
                      display: isFullscreen ? 'flex' : 'block',
                      alignItems: isFullscreen ? 'center' : 'flex-start',
                      justifyContent: isFullscreen ? 'center' : 'flex-start'
                    }}
                    onClick={handleVideoClick}
                    onMouseEnter={handleVideoMouseEnter}
                    onMouseLeave={handleVideoMouseLeave}
                    onMouseMove={(e) => {
                      // Aussi réafficher les contrôles en mode plein écran au mouvement de la souris
                      if (isFullscreen) {
                        setShowControls(true);
                        setIsHovering(true);
                        if (controlsTimeoutRef.current) {
                          clearTimeout(controlsTimeoutRef.current);
                        }
                        if (isPlaying) {
                          controlsTimeoutRef.current = setTimeout(() => {
                            setIsHovering(false);
                            setShowControls(false);
                          }, 3000);
                        }
                      }
                    }}
                  >
                    <iframe
                      ref={videoRef}
                      key={selectedVideo.id}
                      src={`${selectedVideo.url}?autoplay=0&loop=1&muted=0&controls=0`}
                      className={isFullscreen ? "pointer-events-none" : "absolute top-0 left-0 w-full h-full pointer-events-none"}
                      style={{
                        zIndex: 1, // Z-index bas pour que la navbar passe au-dessus
                        width: isFullscreen ? fullscreenVideoDimensions.width : '100%',
                        height: isFullscreen ? fullscreenVideoDimensions.height : '100%',
                        objectFit: isFullscreen ? 'contain' : 'cover',
                        maxWidth: isFullscreen ? '100vw' : 'none',
                        maxHeight: isFullscreen ? '100vh' : 'none'
                      }}
                      frameBorder="0"
                      allow="autoplay; picture-in-picture"
                      title={selectedVideo.title}
                    />

                    {/* Navbar en bas - Mode normal */}
                    {!isFullscreen && (
                      <div
                        className={`${showControls || !isPlaying || isHovering ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                          padding: '0.1rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          transition: 'opacity 0.3s ease-in-out',
                          zIndex: 15,
                          pointerEvents: 'auto',
                          fontFamily: "'Helvetica', 'Arial', sans-serif"
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={handleNavbarMouseEnter}
                        onMouseLeave={handleNavbarMouseLeave}
                      >
                        {/* Icône PAUSE/PLAY */}
                        <div
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (isPlaying) {
                              // Si en lecture, mettre en pause
                              await handleVideoClick();
                            } else {
                              // Si en pause, masquer immédiatement le bouton play.png au centre et lancer la vidéo
                              setIsPlaying(true);
                              if (playerRef.current) {
                                try {
                                  setShowControls(true);
                                  setIsHovering(true);
                                  if (controlsTimeoutRef.current) {
                                    clearTimeout(controlsTimeoutRef.current);
                                  }
                                  await playerRef.current.play();
                                  controlsTimeoutRef.current = setTimeout(() => {
                                    setIsHovering(false);
                                    setShowControls(false);
                                  }, 3000);
                                } catch (err) {
                                  console.error("Error playing video:", err);
                                  setIsPlaying(false);
                                }
                              }
                            }
                          }}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img
                            src={isPlaying ? '/images/pause.png' : '/images/play.png'}
                            alt={isPlaying ? 'Pause' : 'Play'}
                            style={{
                              width: '20px',
                              height: '20px'
                            }}
                          />
                        </div>

                        {/* Barre de progression */}
                        <div
                          className="relative flex-1 h-[1px] bg-gray-600 cursor-pointer rounded-full overflow-hidden"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (playerRef.current) {
                              const rect = e.target.getBoundingClientRect();
                              const clickPosition = e.clientX - rect.left;

                              try {
                                const duration = await playerRef.current.getDuration();
                                if (duration && duration > 0) {
                                  const newTime = (clickPosition / rect.width) * duration;
                                  if (newTime >= 0 && newTime <= duration) {
                                    await playerRef.current.setCurrentTime(newTime);
                                    // Réafficher les contrôles après un clic sur la barre
                                    setShowControls(true);
                                    if (controlsTimeoutRef.current) {
                                      clearTimeout(controlsTimeoutRef.current);
                                    }
                                    if (isPlaying) {
                                      controlsTimeoutRef.current = setTimeout(() => {
                                        setShowControls(false);
                                      }, 3000);
                                    }
                                  }
                                }
                              } catch (err) {
                                console.error("Error setting time:", err);
                              }
                            }
                          }}
                        >
                          <div
                            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>

                        {/* Icône MUTE/UNMUTE */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMute(e);
                          }}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img
                            src={isMuted ? '/images/soundoff.png' : '/images/soundon.png'}
                            alt={isMuted ? 'Unmute' : 'Mute'}
                            style={{
                              width: '36px',
                              height: '36px'
                            }}
                          />
                        </div>

                        {/* Bouton Fullscreen */}
                        {!isFullscreen && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFullscreen();
                            }}
                            className="bg-transparent border-none cursor-pointer flex items-center justify-center flex-shrink-0"
                            style={{
                              pointerEvents: 'auto',
                              padding: '0.25rem'
                            }}
                          >
                            <img
                              src="/images/open.png"
                              alt="Plein écran"
                              style={{
                                display: 'block',
                                width: `${spacing.openIconWidth}px`,
                                height: `${spacing.openIconHeight}px`,
                                marginBottom: spacing.isMobile ? '3px' : '0'
                              }}
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </div>


                </>
              ) : (
                <div className="flex items-center justify-center h-[12.5rem] md:h-[30.1875rem] bg-gray-200">
                  <p>Loading video...</p>
                </div>
              )}
            </div>

            {/* Infos vidéo */}
            <div
              className="flex flex-col justify-start font-HelveticaNeue font-light text-grey-dark"
              style={{
                boxSizing: 'border-box',
                width: spacing.isMobile ? '100%' : 'auto',
                flex: spacing.isMobile ? 'none' : '1',
                minWidth: spacing.isMobile ? 'auto' : '20.83vw',
                margin: spacing.isMobile ? '18px 18px 0px 18px' : '1.125rem 0px 0px 1.125rem',
                marginTop: spacing.isMobile ? '1rem' : '1.125rem'
              }}
            >
              <h3
                className={`text-[12px] ${spacing.isMobile ? '' : 'lg:text-[17px] lg:mb-0'} font-[500] mb-[6px]`}
                style={{
                  fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: spacing.isMobile ? undefined : `${spacing.titleFontSize}px`,
                  marginBottom: spacing.isMobile ? undefined : '0'
                }}
              >
                {selectedVideo?.title}
              </h3>
              <p
                className={`text-[12px] font-HelveticaNeue ${spacing.isMobile ? 'mb-[26px]' : 'lg:text-[17px] lg:mb-[4.55rem] lg:mt-[0.75rem]'} font-style: italic`}
                style={{
                  fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: spacing.isMobile ? undefined : `${spacing.subtitleFontSize}px`,
                  marginBottom: spacing.isMobile ? undefined : `calc(${0.65 * spacing.subtitleFontSize / 20}rem + 15px)`,
                  marginTop: spacing.isMobile ? undefined : `${0.75 * spacing.subtitleFontSize / 20}rem`
                }}
              >
                {selectedVideo?.soustitre}
              </p>
              <p
                className={`text-[12px] font-HelveticaNeue font-[300] ${spacing.isMobile ? '' : 'lg:text-[17px]'} `}
                style={{
                  fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: spacing.isMobile ? undefined : `${spacing.descriptionFontSize}px`
                }}
              >
                {selectedVideo?.description}
              </p>
            </div>
          </div>

          {/* Espacement Video → Carrousel - variable, s'adapte pour que tout tienne dans 100vh */}
          <div
            style={{
              height: `${spacing.carouselSpacing}px`, // Espacement dynamique calculé
              backgroundColor: 'transparent'
            }}
          />

          {/* Carrousel des vidéos */}
          <div
            className="w-full"
            style={{
              paddingLeft: `${spacing.horizontalMargin}px`,
              paddingRight: `${spacing.horizontalMargin}px`,
              boxSizing: 'border-box'
            }}
          >
            <Carousel
              videos={videos}
              onSelectVideo={setSelectedVideo}
              selectedVideo={selectedVideo}
            />
          </div>

        </>
      )}

      {/* Navbar en mode plein écran - Rendu via Portal dans le body */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Bouton Close en haut à droite - Mode plein écran */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreen();
            }}
            style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              zIndex: 2147483647,
              pointerEvents: 'auto',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <img
              src="/images/close.png"
              alt="Fermer plein écran"
              className="w-[20px] h-[20px] md:w-[25px] md:h-[25px]"
              style={{ display: 'block' }}
            />
          </button>

          {/* Pas de bouton play/pause au centre en plein écran - géré par le bouton dans le conteneur vidéo */}

          {/* Navbar */}
          <div
            data-fullscreen-navbar
            className={(!isPlaying || showControls || isHovering) ? 'opacity-100' : 'opacity-0'}
            style={{
              position: 'fixed',
              bottom: '0',
              left: '0',
              right: '0',
              padding: '0.1rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              transition: 'opacity 0.3s ease-in-out',
              zIndex: 2147483647, // Z-index maximum pour être au-dessus de tout
              pointerEvents: 'auto',
              fontFamily: "'Helvetica', 'Arial', sans-serif"
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={handleNavbarMouseEnter}
            onMouseLeave={handleNavbarMouseLeave}
          >
            {/* Icône PAUSE/PLAY */}
            <div
              onClick={async (e) => {
                e.stopPropagation();
                if (isPlaying) {
                  // Si en lecture, mettre en pause
                  await handleVideoClick();
                } else {
                  // Si en pause, masquer immédiatement le bouton play.png au centre et lancer la vidéo
                  setIsPlaying(true);
                  if (playerRef.current) {
                    try {
                      setShowControls(true);
                      setIsHovering(true);
                      if (controlsTimeoutRef.current) {
                        clearTimeout(controlsTimeoutRef.current);
                      }
                      await playerRef.current.play();
                      controlsTimeoutRef.current = setTimeout(() => {
                        setIsHovering(false);
                        setShowControls(false);
                      }, 3000);
                    } catch (err) {
                      console.error("Error playing video:", err);
                      setIsPlaying(false);
                    }
                  }
                }
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={isPlaying ? '/images/pause.png' : '/images/play.png'}
                alt={isPlaying ? 'Pause' : 'Play'}
                style={{
                  width: '20px',
                  height: '20px'
                }}
              />
            </div>
            {/* Barre de progression */}
            <div
              className="relative flex-1 h-1 bg-grey-600 cursor-pointer rounded-full overflow-hidden"
              onClick={async (e) => {
                e.stopPropagation();
                if (playerRef.current) {
                  const rect = e.target.getBoundingClientRect();
                  const clickPosition = e.clientX - rect.left;

                  try {
                    const duration = await playerRef.current.getDuration();
                    if (duration && duration > 0) {
                      const newTime = (clickPosition / rect.width) * duration;
                      if (newTime >= 0 && newTime <= duration) {
                        await playerRef.current.setCurrentTime(newTime);
                        setShowControls(true);
                        if (controlsTimeoutRef.current) {
                          clearTimeout(controlsTimeoutRef.current);
                        }
                        if (isPlaying) {
                          controlsTimeoutRef.current = setTimeout(() => {
                            if (!isHovering) {
                              setShowControls(false);
                            }
                          }, 3000);
                        }
                      }
                    }
                  } catch (err) {
                    console.error("Error setting time:", err);
                  }
                }
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Icône MUTE/UNMUTE */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMute(e);
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={isMuted ? '/images/soundoff.png' : '/images/soundon.png'}
                alt={isMuted ? 'Unmute' : 'Mute'}
                style={{
                  width: '36px',
                  height: '36px'
                }}
              />
            </div>

          </div>
        </>,
        document.body
      )}
    </div>
  );
}
