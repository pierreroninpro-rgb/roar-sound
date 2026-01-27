import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Player from "@vimeo/player";
import Carousel from "./Carrousel.jsx";
import { useOrientation } from "../hooks/useOrientation";

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
  const isLandscape = useOrientation();
  const [isMobile, setIsMobile] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // État pour le son
  const [fullscreenVideoDimensions, setFullscreenVideoDimensions] = useState({ width: '100vw', height: '100vh' }); // Dimensions pour letterboxing en plein écran
  const [isDraggingProgressState, setIsDraggingProgressState] = useState(false); // État pour le drag du curseur (pour re-render)
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9); // Ratio par défaut 16:9 (paysage)
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const videoContainerRef = useRef(null); // Référence pour le conteneur vidéo
  const controlsTimeoutRef = useRef(null); // Référence pour le timeout de masquage des contrôles
  const progressBarRef = useRef(null); // Référence pour la barre de progression (mode normal)
  const progressBarFullscreenRef = useRef(null); // Référence pour la barre de progression (plein écran)
  const isDraggingProgress = useRef(false); // État pour le drag du curseur de progression
  const seekedFromTouchRef = useRef(false); // Évite double seek (touchEnd + click) sur barre
  const justFinishedDragRef = useRef(false); // Évite seek au click après un drag (release sur la barre)
  const durationRef = useRef(0); // Cache durée pour drag fluide (éviter await à chaque move)
  const lastSetCurrentTimeRef = useRef(0); // Throttle setCurrentTime pendant le drag
  const lastDragPercentageRef = useRef(0); // Dernier % pendant drag (seek final au release)
  const progressRef = useRef(0); // Miroir de progress pour init lastDrag au drag start
  const didDragMoveRef = useRef(false); // true si on a bougé pendant le drag (évite seek inutile)

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
    isTabletSmall: false, // État pour savoir si on est en tablette (500px - 1100px) avec logique téléphone
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

      const mobileCheck = screenWidth <= 500; // Même breakpoint que le carrousel (uniquement vrais téléphones)
      setIsMobile(mobileCheck);
      const isMobile = mobileCheck;
      const isTablet = screenWidth > 500 && screenWidth < 1024; // Tablette/petit desktop : entre 500px et 1024px
      const isTabletLarge = screenWidth >= 900 && screenWidth < 1100; // Zone tablette large avec 7 images (étendu jusqu'à 1100px)
      // Toutes les tablettes (500px - 1100px) : logique téléphone (descriptions sous la vidéo)
      const isTabletSmall = screenWidth > 500 && screenWidth < 1100; // Toutes les tablettes avec logique téléphone (étendu jusqu'à 1100px)

      const baseWidth = isMobile ? BASE_WIDTH_MOBILE : BASE_WIDTH_DESKTOP;
      const scaleRatio = screenWidth / baseWidth;
      const refValues = isMobile ? REFERENCE_VALUES.mobile : REFERENCE_VALUES.desktop;

      // Calculer la hauteur de la vidéo de manière progressive
      // Sur les très grands écrans, augmenter progressivement
      let videoHeight;
      let carouselSpacing;
      let bottomMarginFixed;
      let originalCarouselSpacing; // Pour stocker la valeur originale avant modification

      if (isMobile) {
        // Utiliser des unités viewport (vh) pour garantir un rendu cohérent sur tous les téléphones
        // La hauteur de la vidéo en vh (environ 28% de la hauteur d'écran pour correspondre à 220px sur un écran de 390px de large)
        // Sur un iPhone SE (667px de hauteur) : 28vh ≈ 187px
        // Sur un iPhone 15 Pro Max (932px de hauteur) : 28vh ≈ 261px
        // Cela garantit une proportion cohérente sur tous les téléphones
        const videoHeightPercent = 0.28; // 28% de la hauteur d'écran
        videoHeight = screenHeight * videoHeightPercent;

        // Utiliser un pourcentage de la hauteur d'écran pour positionner le carrousel au même niveau
        // sur tous les téléphones (9.275% de la hauteur d'écran - remonté de 0.25% par rapport à 9.525%)
        const carouselSpacingPercent = 0.09275; // 9.275% de la hauteur d'écran (9.525% - 0.25% pour remonter le carrousel)
        carouselSpacing = screenHeight * carouselSpacingPercent;

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

        // Stocker la valeur originale de carouselSpacing avant modification (pour utilisation après)
        originalCarouselSpacing = carouselSpacing;

        // Calculer l'espace disponible pour la vidéo (pour toutes les tailles d'écran)
        const fixedHeight = navbarHeight + refValues.navbarSpacing + carouselSpacing + carouselWithTitle + bottomMarginFixed;
        const availableHeightForVideo = screenHeight - fixedHeight;

        // Calculer un pourcentage adaptatif basé sur la largeur de l'écran pour une transition fluide
        // Plus l'écran est petit, plus la vidéo prend moins d'espace pour laisser de la place aux descriptions
        let videoHeightPercentage = 1.0; // 100% par défaut (desktop)

        if (isTablet || isTabletLarge) {
          // En tablette : réduire progressivement
          videoHeightPercentage = 0.7; // 70% pour tablette
        } else if (!isMobile) {
          // En desktop (≥1024px) : utiliser 100% de l'espace disponible (taille d'origine)
          videoHeightPercentage = 1.0; // 100% pour desktop
        }

        // Appliquer le pourcentage à l'espace disponible
        videoHeight = availableHeightForVideo * videoHeightPercentage;

        // S'assurer d'avoir au moins une hauteur minimale raisonnable
        const minVideoHeight = refValues.videoHeight * 0.4; // Minimum 40% de la hauteur de référence
        videoHeight = Math.max(videoHeight, minVideoHeight);
        videoHeight = Math.min(videoHeight, availableHeightForVideo); // Ne jamais dépasser l'espace disponible
      }

      // Réduire la hauteur de la vidéo de 15% puis agrandir de 5% puis augmenter de 5% puis augmenter de 2%
      const videoHeightBeforeMultipliers = videoHeight;
      videoHeight = videoHeight * 0.85 * 1.05 * 1.05 * 1.02;

      // Calculer l'espace perdu et l'ajouter au carouselSpacing pour maintenir la position du carrousel
      // Ne pas appliquer pour la tablette petite (500px - 762px) qui utilise la logique téléphone
      if (!isMobile && !isTabletSmall && typeof originalCarouselSpacing !== 'undefined' && originalCarouselSpacing !== null) {
        // Utiliser la valeur originale de carouselSpacing pour le calcul de référence
        const navbarHeight = 12 + 60; // margin-top + hauteur navbar approximative
        const carouselWithTitle = 250; // Hauteur approximative du carrousel avec titres
        const fixedHeightForReference = navbarHeight + refValues.navbarSpacing + originalCarouselSpacing + carouselWithTitle + bottomMarginFixed;
        const availableHeightForVideoReference = screenHeight - fixedHeightForReference;
        const fullVideoHeightWithMultipliers = availableHeightForVideoReference * 0.85 * 1.05 * 1.05 * 1.02;

        // Calculer l'espace perdu (différence entre la hauteur à 100% et la hauteur actuelle)
        const lostSpace = fullVideoHeightWithMultipliers - videoHeight;

        // Ajouter l'espace perdu au carouselSpacing pour que le carrousel reste à sa position
        if (lostSpace > 0) {
          carouselSpacing = originalCarouselSpacing + lostSpace;
        }
      }

      // Taille de l'icône open responsive (proportionnelle)
      const openIconBaseWidth = 20; // Taille de base sur desktop
      const openIconBaseHeight = 20; // Taille de base sur desktop
      const openIconWidth = isMobile ? openIconBaseWidth * scaleRatio : openIconBaseWidth;
      const openIconHeight = isMobile ? openIconBaseHeight * scaleRatio : openIconBaseHeight;

      // Tailles de police responsive pour la tablette large (7 images) et tablette normale (5 images)
      const baseTitleFontSize = 17; // 17px en base pour desktop
      const baseSubtitleFontSize = 17; // 17px en base pour desktop
      const baseDescriptionFontSize = 17; // 17px en base pour desktop

      let titleFontSize = 12; // Par défaut mobile
      let subtitleFontSize = 12; // Par défaut mobile
      let descriptionFontSize = 12; // Par défaut mobile

      if (!isMobile) {
        // Pour desktop et tablette : taille fixe à 17px
        titleFontSize = baseTitleFontSize; // 17px
        subtitleFontSize = baseSubtitleFontSize; // 17px
        descriptionFontSize = baseDescriptionFontSize; // 17px
      }

      // En desktop, forcer la marge inférieure à être égale à la marge supérieure de la navbar pour symétrie
      if (!isMobile && !isTablet) {
        bottomMarginFixed = refValues.navbarSpacing;
      }

      const newSpacing = {
        navbarSpacing: refValues.navbarSpacing, // Fixe - ne change pas avec l'écran
        videoSpacing: refValues.videoSpacing, // Fixe - ne change pas avec l'écran
        carouselSpacing: carouselSpacing, // Fixe pour desktop, variable pour mobile (en px mais calculé en % de screenHeight)
        carouselSpacingPercent: isMobile ? 0.09275 : null, // Pourcentage pour mobile (9.275% de la hauteur d'écran - 9.525% - 0.25% pour remonter)
        horizontalMargin: refValues.horizontalMargin, // Fixe - ne change pas avec l'écran
        videoHeight: videoHeight, // En mobile : calculé en vh pour cohérence, en desktop : adaptatif
        videoHeightPercent: isMobile ? 0.28 : null, // Pourcentage pour mobile (28% de la hauteur d'écran)
        bottomMargin: bottomMarginFixed, // Fixe - marge en bas constante (18px mobile, 17px desktop = navbarSpacing)
        isMobile: isMobile, // État mobile pour le rendu
        isTablet: isTablet, // État tablette pour le rendu
        isTabletLarge: isTabletLarge, // État tablette large (7 images) pour le rendu
        isTabletSmall: isTabletSmall, // Toutes les tablettes (500px - 1100px) avec logique téléphone
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
        videoHeight: isMobile && newSpacing.videoHeightPercent
          ? `${(newSpacing.videoHeightPercent * 100).toFixed(2)}vh`
          : `${newSpacing.videoHeight.toFixed(2)}px`
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
      // Réinitialiser la progression à 0 dès le changement de vidéo
      setProgress(0);
      progressRef.current = 0;

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
            if (isDraggingProgress.current) return; // Pendant le drag : on garde la position locale, pas de saccade
            try {
              const duration = await playerRef.current.getDuration();
              if (duration && duration > 0) {
                durationRef.current = duration;
                const pct = (data.seconds / duration) * 100;
                progressRef.current = pct;
                setProgress(pct);
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
            const muted = await playerRef.current.getMuted();
            setIsMuted(muted || volume === 0);
          } catch (err) {
            console.error("Error getting volume:", err);
          }

          // Détecter l'orientation de la vidéo via l'API Vimeo
          try {
            const videoWidth = await playerRef.current.getVideoWidth();
            const videoHeight = await playerRef.current.getVideoHeight();
            if (videoWidth && videoHeight) {
              const aspectRatio = videoWidth / videoHeight;
              setVideoAspectRatio(aspectRatio);
              console.log(`Video aspect ratio detected: ${aspectRatio.toFixed(2)} (${videoWidth}x${videoHeight})`);
            }
          } catch (err) {
            console.error("Error getting video dimensions:", err);
            // Par défaut, supposer format paysage (16:9)
            setVideoAspectRatio(16 / 9);
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

    // Afficher les contrôles
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
        // Sur mobile, activer le son AVANT de jouer pour éviter le double clic
        const isMobileDevice = window.innerWidth <= 820;
        if (isMobileDevice) {
          await activateSoundOnMobile();
        }
        
        await playerRef.current.play();
        setIsPlaying(true);
        
        // Si pas mobile, activer le son après
        if (!isMobileDevice) {
          await activateSoundOnMobile();
        }

        controlsTimeoutRef.current = setTimeout(() => {
          if (!isHovering) {
            setShowControls(false);
          }
        }, 3000);
      }
    } catch (err) {
      console.error("Error controlling video:", err);
      setIsPlaying(false);
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

        // Désactiver les contrôles natifs de Vimeo quand on sort du plein écran sur mobile
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (window.innerWidth <= 820);
        if (isMobileDevice && playerRef.current) {
          try {
            await playerRef.current.setControls(false);
          } catch (err) {
            console.error("Error disabling Vimeo controls:", err);
          }
        }

        // Déverrouiller l'orientation si elle était verrouillée
        try {
          if (screen.orientation && screen.orientation.unlock) {
            await screen.orientation.unlock();
          }
        } catch (orientationErr) {
          console.log("Orientation unlock not supported or already unlocked");
        }

        setIsFullscreen(false);
        if (onFullscreenChange) onFullscreenChange(false);
      } else {
        // **NOUVEAU : Détecter mobile et déclencher fullscreen Vimeo**
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (window.innerWidth <= 820);

        if (isMobileDevice && videoRef.current && playerRef.current) {
          try {
            // Mobile : activer les contrôles natifs de Vimeo avant d'entrer en plein écran
            await playerRef.current.setControls(true);
            // Mobile : uniquement le plein écran natif Vimeo (pas notre overlay). Le close Vimeo ramène à la page.
            await playerRef.current.requestFullscreen();
            return;
          } catch (err) {
            console.error("Mobile Vimeo fullscreen error:", err);
            try {
              const iframe = videoRef.current;
              if (iframe.requestFullscreen) {
                await iframe.requestFullscreen();
              } else if (iframe.webkitRequestFullscreen) {
                await iframe.webkitRequestFullscreen();
              } else if (iframe.mozRequestFullScreen) {
                await iframe.mozRequestFullScreen();
              }
              return;
            } catch (fallbackErr) {
              console.error("Fallback fullscreen also failed:", fallbackErr);
            }
          }
        }

        // **Desktop : ton code actuel**
        const elementToFullscreen = document.documentElement;

        try {
          if (elementToFullscreen.requestFullscreen) {
            if (!isMobileDevice) {
              await elementToFullscreen.requestFullscreen({ navigationUI: 'hide' });
            } else {
              await elementToFullscreen.requestFullscreen();
            }
          } else if (elementToFullscreen.webkitRequestFullscreen) {
            if (Element && Element.ALLOW_KEYBOARD_INPUT) {
              await elementToFullscreen.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            } else {
              await elementToFullscreen.webkitRequestFullscreen();
            }
          } else if (elementToFullscreen.mozRequestFullScreen) {
            await elementToFullscreen.mozRequestFullScreen();
          } else if (elementToFullscreen.msRequestFullscreen) {
            await elementToFullscreen.msRequestFullscreen();
          }
        } catch (err) {
          console.log("Fullscreen request failed, trying without options:", err);
          if (elementToFullscreen.requestFullscreen) {
            await elementToFullscreen.requestFullscreen();
          } else if (elementToFullscreen.webkitRequestFullscreen) {
            if (Element && Element.ALLOW_KEYBOARD_INPUT) {
              await elementToFullscreen.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            } else {
              await elementToFullscreen.webkitRequestFullscreen();
            }
          } else if (elementToFullscreen.mozRequestFullScreen) {
            await elementToFullscreen.mozRequestFullScreen();
          } else if (elementToFullscreen.msRequestFullscreen) {
            await elementToFullscreen.msRequestFullscreen();
          }
        }

        setIsFullscreen(true);
        if (onFullscreenChange) onFullscreenChange(true);

        // Reste du code pour desktop (orientation lock, etc.)
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (orientationErr) {
          console.log("Screen Orientation API not available:", orientationErr);
        }

        // Calculer les dimensions pour letterboxing (desktop uniquement)
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = 16 / 9;

        let iframeWidth, iframeHeight;

        if (screenWidth / screenHeight > aspectRatio) {
          iframeHeight = screenHeight;
          iframeWidth = screenHeight * aspectRatio;
        } else {
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

      // Vérifier que c'est bien le document entier qui est en plein écran (ou notre conteneur pour compatibilité)
      const isOurFullscreen = fullscreenElement === document.documentElement || fullscreenElement === videoContainerRef.current;

      setIsFullscreen(isCurrentlyFullscreen && isOurFullscreen);
      if (onFullscreenChange) onFullscreenChange(isCurrentlyFullscreen && isOurFullscreen);
      // Forcer l'affichage des contrôles quand on entre/sort du plein écran
      if (isCurrentlyFullscreen && isOurFullscreen) {
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
            // Activer le son en mobile après l'interaction utilisateur
            await activateSoundOnMobile();
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

  // Gérer les raccourcis clavier (Espace pour play/pause, Échap pour quitter plein écran)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignorer si l'utilisateur est en train de taper dans un input, textarea, etc.
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Touche Échap : quitter le plein écran
      if (e.code === 'Escape' || e.key === 'Escape') {
        if (isFullscreen) {
          e.preventDefault();
          handleFullscreen();
        }
        return;
      }

      // Touche Espace : play/pause (uniquement si une vidéo est sélectionnée)
      if (selectedVideo && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault(); // Empêcher le scroll de la page
        handleVideoClick();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedVideo, isPlaying, isFullscreen]); // Dépendances pour que les fonctions soient à jour

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

  // Fonction helper pour activer le son en mobile après une interaction utilisateur
  const activateSoundOnMobile = async () => {
    const isMobileDevice = window.innerWidth <= 820;
    if (isMobileDevice && playerRef.current) {
      try {
        await playerRef.current.setMuted(false);
        await playerRef.current.setVolume(1);
        setIsMuted(false);
      } catch (err) {
        console.error("Error unmuting video:", err);
      }
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
        // Activer le son en mobile après l'interaction utilisateur
        await activateSoundOnMobile();

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

  // Gérer le drag du curseur de progression
  const handleProgressDragStart = async (e) => {
    e.stopPropagation();
    isDraggingProgress.current = true;
    setIsDraggingProgressState(true);
    didDragMoveRef.current = false;
    lastDragPercentageRef.current = progressRef.current;
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (durationRef.current <= 0 && playerRef.current) {
      try {
        const d = await playerRef.current.getDuration();
        if (d > 0) durationRef.current = d;
      } catch (_) { }
    }
  };

  const handleProgressDrag = (e, progressBarElement) => {
    if (!isDraggingProgress.current || !progressBarElement || !playerRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = progressBarElement.getBoundingClientRect();
    const clientX = (e.touches?.length ? e.touches[0].clientX : null) ?? e.clientX;
    const clickPosition = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percentage = (clickPosition / rect.width) * 100;

    lastDragPercentageRef.current = percentage;
    progressRef.current = percentage;
    didDragMoveRef.current = true;
    setProgress(percentage); // Mise à jour immédiate = curseur fluide (optimistic UI)

    const duration = durationRef.current;
    if (!(duration > 0)) return;

    const now = Date.now();
    const throttleMs = 80;
    if (now - lastSetCurrentTimeRef.current < throttleMs) return;
    lastSetCurrentTimeRef.current = now;

    const newTime = (percentage / 100) * duration;
    playerRef.current.setCurrentTime(Math.max(0, Math.min(duration, newTime))).catch((err) => {
      console.error("Error setting time:", err);
    });
  };

  const handleProgressDragEnd = async () => {
    const finalPct = lastDragPercentageRef.current;
    const dur = durationRef.current;
    const didMove = didDragMoveRef.current;
    isDraggingProgress.current = false;
    setIsDraggingProgressState(false);
    justFinishedDragRef.current = true;
    setTimeout(() => { justFinishedDragRef.current = false; }, 150);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isHovering) {
          setShowControls(false);
        }
      }, 3000);
    }
    if (didMove && dur > 0 && playerRef.current && finalPct >= 0 && finalPct <= 100) {
      try {
        await playerRef.current.setCurrentTime((finalPct / 100) * dur);
      } catch (_) { }
    }
  };

  const seekBarAtClientX = async (clientX, progressBarEl) => {
    if (!progressBarEl || !playerRef.current) return;
    const rect = progressBarEl.getBoundingClientRect();
    const clickPosition = Math.max(0, Math.min(rect.width, clientX - rect.left));
    try {
      const duration = await playerRef.current.getDuration();
      if (duration && duration > 0) {
        durationRef.current = duration;
        const newTime = (clickPosition / rect.width) * duration;
        if (newTime >= 0 && newTime <= duration) {
          await playerRef.current.setCurrentTime(newTime);
          setShowControls(true);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
              if (!isHovering) setShowControls(false);
            }, 3000);
          }
        }
      }
    } catch (err) {
      console.error("Error setting time:", err);
    }
  };

  // Gérer les événements de drag globaux
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingProgress.current) {
        const progressBar = progressBarRef.current || progressBarFullscreenRef.current;
        if (progressBar) {
          handleProgressDrag(e, progressBar);
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingProgress.current) {
        handleProgressDragEnd();
      }
    };

    const handleTouchMove = (e) => {
      if (isDraggingProgress.current) {
        e.preventDefault();
        const progressBar = progressBarRef.current || progressBarFullscreenRef.current;
        if (progressBar) {
          handleProgressDrag(e, progressBar);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingProgress.current) {
        handleProgressDragEnd();
      }
    };

    const handleTouchCancel = () => {
      if (isDraggingProgress.current) {
        handleProgressDragEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isPlaying, isHovering]);

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
    videoHeight: spacing.isMobile && spacing.videoHeightPercent
      ? `${(spacing.videoHeightPercent * 100).toFixed(2)}vh`
      : `${spacing.videoHeight.toFixed(2)}px`
  });

  return (
    <div
      ref={containerRef}
      className="w-full max-w-full scrollbar-hide no-scrollbar"
      style={{
        boxSizing: 'border-box',
        overflow: (isMobile && !isFullscreen) ? 'hidden' : (isMobile && isFullscreen) ? 'auto' : 'hidden', // Désactiver le scroll sauf en plein écran mobile
        overflowX: 'hidden',
        overflowY: (isMobile && isFullscreen) ? 'auto' : 'hidden', // Permettre le scroll vertical uniquement en plein écran mobile
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: isFullscreen ? '0' : `${spacing.bottomMargin}px`, // Marge en bas fixe (18px mobile, 28px desktop)
        paddingLeft: isFullscreen ? '0' : undefined,
        paddingRight: isFullscreen ? '0' : undefined,
        paddingTop: isFullscreen ? '0' : undefined,
        margin: isFullscreen ? '0' : undefined,
        height: isFullscreen ? '100vh' : '100vh', // Hauteur totale de la fenêtre
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        position: 'relative',
        backgroundColor: isFullscreen ? '#000' : 'transparent'
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
              flexDirection: (spacing.isMobile || spacing.isTabletSmall) ? 'column' : 'row',
              gap: (spacing.isMobile || spacing.isTabletSmall) ? '0' : '1.5rem',
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
                      height: isFullscreen ? '100vh' : (spacing.isMobile && spacing.videoHeightPercent
                        ? `${spacing.videoHeightPercent * 100}vh` // En mobile : utiliser vh pour cohérence
                        : `${spacing.videoHeight}px`), // Desktop : pixels
                      width: isFullscreen ? '100vw' : '100%',
                      maxWidth: isFullscreen ? '100vw' : (spacing.isMobile ? '100%' : `${(spacing.videoHeight * 16) / 9}px`),
                      boxSizing: 'border-box',
                      position: isFullscreen ? 'fixed' : 'relative',
                      top: isFullscreen ? '0' : undefined,
                      left: isFullscreen ? '0' : undefined,
                      right: isFullscreen ? '0' : undefined,
                      bottom: isFullscreen ? '0' : undefined,
                      backgroundColor: isFullscreen ? '#000' : 'transparent',
                      display: isFullscreen ? 'flex' : 'block',
                      alignItems: isFullscreen ? 'center' : 'flex-start',
                      justifyContent: isFullscreen ? 'center' : 'flex-start',
                      zIndex: isFullscreen ? 2147483646 : undefined
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
                      src={`${selectedVideo.url}?autoplay=0&loop=1&muted=0&controls=0&responsive=1`} style={{
                        zIndex: 1, // Z-index bas pour que la navbar passe au-dessus
                        width: isFullscreen ? '100vw' : '100%',
                        height: isFullscreen ? '100vh' : '100%',
                        objectFit: 'cover', // Toujours cover pour plein écran sans bandes noires
                        maxWidth: isFullscreen ? '100vw' : 'none',
                        maxHeight: isFullscreen ? '100vh' : 'none',
                        position: isFullscreen ? 'fixed' : 'absolute',
                        top: isFullscreen ? '0' : '0',
                        left: isFullscreen ? '0' : '0',
                        right: isFullscreen ? '0' : undefined,
                        bottom: isFullscreen ? '0' : undefined,
                        pointerEvents: 'auto', // Permettre les interactions avec l'iframe
                        cursor: 'pointer' // Curseur main pour indiquer qu'on peut cliquer
                      }}
                      frameBorder="0"
                      allow="autoplay; picture-in-picture; fullscreen"
                      allowFullScreen
                      webkitAllowFullScreen
                      mozallowfullscreen
                      title={selectedVideo.title}
                    />
                    {/* Overlay transparent pour capturer les clics sur la vidéo */}
                    <div
                      onClick={async (e) => {
                        // Ne pas capturer les clics sur les éléments interactifs
                        if (e.target.closest('[data-navbar]') || e.target.closest('img')) {
                          return;
                        }
                        // Ne déclencher que si on clique directement sur l'overlay (pas sur les enfants)
                        if (e.target === e.currentTarget) {
                          e.preventDefault();
                          await handlePlayPause();
                        }
                      }}
                      onTouchStart={async (e) => {
                        // Ne pas capturer les touches sur les éléments interactifs
                        if (e.target.closest('[data-navbar]') || e.target.closest('img')) {
                          return;
                        }
                        if (e.target === e.currentTarget) {
                          e.preventDefault();
                          await handlePlayPause();
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10, // Au-dessus de l'iframe mais en-dessous de la navbar (z-index 15)
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        backgroundColor: 'transparent'
                      }}
                    />

                    {/* Navbar en bas - Mode normal */}
                    {!isFullscreen && (
                      <div
                        data-navbar
                        className={`${(spacing.isMobile || showControls || !isPlaying || isHovering) ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                          padding: '0.1rem 1rem',
                          paddingBottom: 'calc(0.1rem + 4px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          position: 'absolute',
                          bottom: '4px',
                          left: spacing.isMobile ? `${spacing.horizontalMargin}px` : '0',
                          right: spacing.isMobile ? `${spacing.horizontalMargin}px` : '0',
                          transition: 'opacity 0.3s ease-in-out',
                          zIndex: 20, // Z-index élevé pour être au-dessus de l'overlay
                          pointerEvents: 'auto',
                          fontFamily: "'Helvetica', 'Arial', sans-serif",
                          boxSizing: 'border-box'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          // Sur mobile, afficher toujours la navbar au touch
                          setShowControls(true);
                          setIsHovering(true);
                        }}
                        onMouseEnter={handleNavbarMouseEnter}
                        onMouseLeave={handleNavbarMouseLeave}
                      >
                        {/* Icône PAUSE/PLAY */}
                        <div
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            await handlePlayPause();
                          }}
                          onTouchStart={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            await handlePlayPause();
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
                          className="relative flex-1 flex items-center min-h-[32px] cursor-pointer rounded-full overflow-visible"
                          onClick={async (e) => {
                            if (isDraggingProgressState || seekedFromTouchRef.current || justFinishedDragRef.current) return;
                            e.stopPropagation();
                            seekedFromTouchRef.current = false;
                            await seekBarAtClientX(e.clientX, progressBarRef.current);
                          }}
                          onTouchEnd={(e) => {
                            if (isDraggingProgressState || justFinishedDragRef.current) return;
                            if (!e.changedTouches?.length) return;
                            e.preventDefault();
                            e.stopPropagation();
                            seekedFromTouchRef.current = true;
                            seekBarAtClientX(e.changedTouches[0].clientX, progressBarRef.current);
                            setTimeout(() => { seekedFromTouchRef.current = false; }, 400);
                          }}
                        >
                          <div
                            ref={progressBarRef}
                            className="relative w-full h-1 bg-gray-600 rounded-full overflow-visible"
                          >
                            <div
                              className="absolute top-0 left-0 h-full bg-white rounded-full"
                              style={{
                                width: `${progress}%`,
                                transition: isDraggingProgressState ? 'none' : 'all 0.1s ease-out'
                              }}
                            />
                          </div>
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

                        {/* Bouton Fullscreen - Masqué en plein écran mobile natif */}
                        {!(spacing.isMobile && isFullscreen) && (
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
                              alt={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
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
                width: (spacing.isMobile || spacing.isTabletSmall) ? '100%' : 'auto',
                flex: (spacing.isMobile || spacing.isTabletSmall) ? 'none' : '1',
                minWidth: (spacing.isMobile || spacing.isTabletSmall) ? 'auto' : '20.83vw',
                margin: spacing.isMobile ? '18px 18px 0px 18px' : spacing.isTabletSmall ? `${spacing.horizontalMargin}px ${spacing.horizontalMargin}px 0px ${spacing.horizontalMargin}px` : '1.125rem 0px 0px 1.125rem',
                marginTop: spacing.isMobile ? '1rem' : spacing.isTabletSmall ? '1rem' : '1.125rem'
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
                className={`text-[12px] font-HelveticaNeue ${spacing.isMobile ? 'mb-[23px]' : 'lg:text-[17px] lg:mb-[4.55rem] lg:mt-[0.75rem]'} font-style: italic`}
                style={{
                  fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: spacing.isMobile ? undefined : `${spacing.subtitleFontSize}px`,
                  marginBottom: spacing.isMobile ? undefined : `calc(${0.65 * spacing.subtitleFontSize / 20}rem + 12px)`,
                  marginTop: spacing.isMobile ? undefined : `${0.75 * spacing.subtitleFontSize / 20}rem`
                }}
              >
                {selectedVideo?.soustitre}
              </p>
              <p
                className={`text-[12px] font-HelveticaNeue font-[300] ${spacing.isMobile ? '' : 'lg:text-[17px]'} `}
                style={{
                  fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: spacing.isMobile ? undefined : `${spacing.descriptionFontSize}px`,
                  marginBottom: spacing.isMobile ? 'calc(1px + 0.275vh)' : 'calc(1px + 0.275vh)'
                }}
              >
                {selectedVideo?.description}
              </p>
            </div>
          </div>

          {/* Espacement Video → Carrousel - variable, s'adapte pour que tout tienne dans 100vh */}
          <div
            style={{
              height: spacing.isMobile && spacing.carouselSpacingPercent
                ? `${spacing.carouselSpacingPercent * 100}vh` // En mobile : utiliser un pourcentage de la hauteur d'écran
                : `${spacing.carouselSpacing}px`, // Desktop : espacement en pixels
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
            onMouseMove={() => {
              // Afficher les contrôles au mouvement de la souris
              setShowControls(true);
              setIsHovering(true);
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
              padding: '0.25rem',
              opacity: 1,
              display: 'block'
            }}
          >
            <img
              src="/images/close.png"
              alt="Fermer plein écran"
              className="w-[20px] h-[20px] md:w-[25px] md:h-[25px]"
              style={{ display: 'block', opacity: 1 }}
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
            onMouseMove={() => {
              // S'assurer que les contrôles sont visibles au mouvement de la souris
              setShowControls(true);
              setIsHovering(true);
            }}
          >
            {/* Icône PAUSE/PLAY */}
            <div
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                await handlePlayPause();
              }}
              onTouchStart={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                await handlePlayPause();
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
              className="relative flex-1 flex items-center min-h-[32px] cursor-pointer rounded-full overflow-visible"
              onClick={async (e) => {
                if (isDraggingProgressState || seekedFromTouchRef.current || justFinishedDragRef.current) return;
                e.stopPropagation();
                seekedFromTouchRef.current = false;
                await seekBarAtClientX(e.clientX, progressBarFullscreenRef.current);
              }}
              onTouchEnd={(e) => {
                if (isDraggingProgressState || justFinishedDragRef.current) return;
                if (!e.changedTouches?.length) return;
                e.preventDefault();
                e.stopPropagation();
                seekedFromTouchRef.current = true;
                seekBarAtClientX(e.changedTouches[0].clientX, progressBarFullscreenRef.current);
                setTimeout(() => { seekedFromTouchRef.current = false; }, 400);
              }}
            >
              <div
                ref={progressBarFullscreenRef}
                className="relative w-full h-1 bg-grey-600 rounded-full overflow-visible"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-white rounded-full"
                  style={{
                    width: `${progress}%`,
                    transition: isDraggingProgressState ? 'none' : 'all 0.1s ease-out'
                  }}
                />
              </div>
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

            {/* Bouton Fullscreen - Toujours visible même en plein écran */}
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
                alt="Quitter plein écran"
                style={{
                  display: 'block',
                  width: '20px',
                  height: '20px'
                }}
              />
            </button>

          </div>
        </>,
        document.body
      )}
    </div>
  );
}
