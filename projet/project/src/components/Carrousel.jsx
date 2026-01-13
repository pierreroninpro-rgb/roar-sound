import { useRef, useEffect, useState } from "react";
import { useOrientation } from "../hooks/useOrientation";

export default function Carousel({ videos, onSelectVideo, selectedVideo, carouselBottomMargin = 60 }) {
    const containerRef = useRef(null);
    const animationRef = useRef();
    const [items, setItems] = useState([]);
    const [centerVideo, setCenterVideo] = useState(null);

    const speedRef = useRef(0);
    const targetSpeed = useRef(0);

    const isAutoCentering = useRef(false);
    const targetItemRef = useRef(null);
    const centerPauseTimeout = useRef(null);

    const videoList = videos || [];

    // Dimensions uniformes - toutes les images ont la même largeur
    const BASE_CARD_WIDTH = 100; // Largeur de base
    const BASE_GAP = 70; // Gap uniforme entre toutes les images (desktop)
    const BASE_GAP_MOBILE = 30; // Gap réduit pour mobile
    const BASE_CARD_HEIGHT = 140; // Hauteur de base réduite pour correspondre à l'espacement
    const TITLE_FONT_SIZE = 16;

    const VISIBLE_ITEMS_DESKTOP = 9;
    const VISIBLE_ITEMS_TABLET = 5;
    const VISIBLE_ITEMS_TABLET_LARGE = 7; // Zone intermédiaire pour 7 images
    const VISIBLE_ITEMS_MOBILE = 3;

    const [dimensions, setDimensions] = useState({
        cardWidth: BASE_CARD_WIDTH,
        gap: BASE_GAP,
        cardHeight: BASE_CARD_HEIGHT,
        containerHeight: BASE_CARD_HEIGHT + 8 + 50 // Hauteur par défaut
    });
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const isLandscape = useOrientation();

    useEffect(() => {
        const calculateDimensions = () => {
            // Utiliser window.innerWidth si le container n'est pas encore monté
            const containerWidth = containerRef.current
                ? containerRef.current.getBoundingClientRect().width || window.innerWidth
                : window.innerWidth;

            if (containerWidth === 0 || !containerWidth) {
                // Si on a un ref, réessayer plus tard
                if (containerRef.current) {
                    requestAnimationFrame(calculateDimensions);
                }
                return;
            }

            const mobile = containerWidth <= 820;
            const tablet = containerWidth > 820 && containerWidth < 1024;
            const tabletLarge = containerWidth >= 900 && containerWidth < 1024; // Zone avec 7 images
            setIsMobile(mobile);
            setIsTablet(tablet);
            const visibleItems = mobile ? VISIBLE_ITEMS_MOBILE : (tabletLarge ? VISIBLE_ITEMS_TABLET_LARGE : (tablet ? VISIBLE_ITEMS_TABLET : VISIBLE_ITEMS_DESKTOP));

            // Calculer la largeur uniforme pour toutes les images
            let finalCardWidth;

            if (mobile) {
                // Mobile : dimensions fixes 79px × 141px
                finalCardWidth = 79; // Largeur fixe de 79px

                // Calculer le gap pour que 3 images soient visibles
                const mobilePadding = 20; // Espace à gauche et à droite (40px au total)
                const availableWidth = containerWidth - (2 * mobilePadding); // Largeur disponible moins les marges
                const totalImagesWidth = 3 * 79; // 237px pour 3 images
                const numberOfGaps = 2; // 2 gaps pour 3 images
                const calculatedGap = (availableWidth - totalImagesWidth) / numberOfGaps;

                // Utiliser le gap calculé, avec une valeur minimale de sécurité
                const finalGap = Math.max(calculatedGap, BASE_GAP_MOBILE);

                // Calculer la hauteur du conteneur en fonction de l'espace disponible
                // Pour s'assurer que les titres sont toujours visibles sur tous les iPhones
                const cardHeight = 141; // Hauteur fixe de l'image
                const marginTop = 11; // Margin-top pour mobile
                const titleHeight = 40; // Espace pour le titre (augmenté pour éviter la coupure)
                const containerHeight = cardHeight + marginTop + titleHeight;

                setDimensions({
                    cardWidth: finalCardWidth,
                    gap: finalGap,
                    cardHeight: cardHeight,
                    containerHeight: containerHeight
                });
                return; // Sortir de la fonction car on a déjà défini les dimensions
            } else {
                // Desktop : dimensions fixes 105px × 186px pour 9 images visibles
                if (visibleItems === VISIBLE_ITEMS_DESKTOP) {
                    // Desktop : dimensions fixes
                    finalCardWidth = 105; // Largeur fixe de 105px

                    // Calculer le gap pour que 9 images soient visibles
                    // 9 images × 105px = 945px
                    // Il faut 8 gaps entre les 9 images
                    // containerWidth = 9 × 105 + 8 × gap
                    // gap = (containerWidth - 945) / 8
                    const totalImagesWidth = 9 * 105; // 945px
                    const numberOfGaps = 8; // 8 gaps pour 9 images
                    const calculatedGap = (containerWidth - totalImagesWidth) / numberOfGaps;

                    // Utiliser le gap calculé, avec une valeur minimale de sécurité
                    // Si le conteneur est trop petit, utiliser un gap minimum
                    const finalGap = Math.max(calculatedGap, 20); // Gap minimum de 20px

                    // Si le conteneur est vraiment trop petit (moins de 945px), on garde quand même un gap raisonnable
                    if (calculatedGap < 0) {
                        console.warn(`Conteneur trop petit (${containerWidth}px) pour 9 images de 105px. Gap ajusté à 20px.`);
                    }

                    setDimensions({
                        cardWidth: finalCardWidth,
                        gap: finalGap,
                        cardHeight: 186, // Hauteur fixe de 186px
                        containerHeight: 186 + 8 + 50 // Image + margin-top + titre
                    });
                    return; // Sortir de la fonction car on a déjà défini les dimensions
                } else {
                    // Tablet : calcul normal
                    const totalGaps = visibleItems - 1; // Nombre de gaps entre les images visibles
                    const availableWidthForCards = Math.max(0, containerWidth - (totalGaps * BASE_GAP));
                    const uniformCardWidth = availableWidthForCards / visibleItems;

                    finalCardWidth = uniformCardWidth;

                    // Limiter les tailles pour éviter les valeurs aberrantes
                    if (finalCardWidth <= 0 || !isFinite(finalCardWidth)) {
                        finalCardWidth = BASE_CARD_WIDTH; // Valeur par défaut
                    }
                }
            }

            // La hauteur reste proportionnelle à la largeur (sauf pour desktop qui a déjà été défini)
            const aspectRatio = BASE_CARD_HEIGHT / BASE_CARD_WIDTH;
            let finalCardHeight = finalCardWidth * aspectRatio;

            setDimensions({
                cardWidth: finalCardWidth,
                gap: mobile ? BASE_GAP_MOBILE : BASE_GAP, // Gap réduit pour mobile, normal pour desktop
                cardHeight: finalCardHeight,
                containerHeight: finalCardHeight + 8 + 50 // Hauteur par défaut pour desktop/tablet
            });
        };

        calculateDimensions();

        const handleResize = () => {
            calculateDimensions();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [videoList.length]);

    useEffect(() => {
        if (!videoList.length || dimensions.cardWidth === 0) return;

        // Positions simples : toutes les images avec la même largeur et le même gap
        const gap = dimensions.gap;
        const cardWidth = dimensions.cardWidth;

        // Pour mobile, calculer startX pour centrer l'image du milieu
        let startX = 0;
        if (isMobile) {
            // Utiliser la largeur du conteneur interne (containerRef) qui a width: 100%
            // Le conteneur parent a un padding de 20px à gauche et à droite
            const containerWidth = containerRef.current
                ? containerRef.current.getBoundingClientRect().width
                : window.innerWidth - 40; // Approximatif si pas encore monté (window.innerWidth - 40px de padding)

            // Calculer la position pour que l'image du milieu (la 2ème des 3 visibles) soit centrée
            // L'image du milieu est à la position : startX + (cardWidth + gap)
            // Son centre est à : startX + (cardWidth + gap) + cardWidth/2
            // On veut que ce centre soit au centre du conteneur : containerWidth / 2
            // Donc : startX + (cardWidth + gap) + cardWidth/2 = containerWidth / 2
            // startX = containerWidth / 2 - (cardWidth + gap) - cardWidth/2
            // startX = containerWidth / 2 - 1.5*cardWidth - gap
            const centerOfContainer = containerWidth / 2;
            startX = centerOfContainer - (cardWidth + gap) - (cardWidth / 2);
        }

        const initialPositions = videoList.map((v, i) => {
            const x = startX + i * (cardWidth + gap);
            return { ...v, x };
        });
        setItems(initialPositions);
    }, [videos, dimensions, isMobile]);

    useEffect(() => {
        if (dimensions.cardWidth === 0) return;

        // Calculer totalWidth une seule fois
        const totalWidth = (dimensions.cardWidth + dimensions.gap) * videoList.length;
        const cardWidthPlusGap = dimensions.cardWidth + dimensions.gap;
        const minX = -cardWidthPlusGap;
        const maxX = totalWidth - dimensions.cardWidth;
        const halfTotalWidth = totalWidth / 2;

        const loop = () => {
            if (!containerRef.current || items.length === 0 || totalWidth === 0) {
                animationRef.current = requestAnimationFrame(loop);
                return;
            }

            if (isAutoCentering.current && targetItemRef.current) {
                const itemToCenter = targetItemRef.current;
                const rect = containerRef.current.getBoundingClientRect();
                const center = rect.width / 2;

                setItems((prev) => {
                    const currentItem = prev.find((v) => v.id === itemToCenter.id);
                    if (!currentItem) return prev;

                    const itemCenter = currentItem.x + dimensions.cardWidth / 2;
                    let distance = center - itemCenter;

                    // Optimiser le calcul du loop
                    if (distance > halfTotalWidth) distance -= totalWidth;
                    else if (distance < -halfTotalWidth) distance += totalWidth;

                    if (Math.abs(distance) < 0.5) {
                        isAutoCentering.current = false;
                        targetSpeed.current = 0;
                        return prev;
                    }

                    const speed = distance * 0.1;
                    // Utiliser une boucle for pour de meilleures performances
                    const newItems = new Array(prev.length);
                    for (let i = 0; i < prev.length; i++) {
                        let newX = prev[i].x + speed;
                        if (newX < minX) newX += totalWidth;
                        else if (newX > maxX) newX -= totalWidth;
                        newItems[i] = { ...prev[i], x: newX };
                    }
                    return newItems;
                });
            }

            // Gérer le mouvement automatique (desktop) ou la décélération après swipe (mobile)
            if (!isAutoCentering.current && !targetItemRef.current) {
                // En mobile, seulement si on n'est pas en train de drag
                if (isMobile && isDragging.current) {
                    // Ne rien faire pendant le drag (le mouvement est géré directement dans handleTouchMove)
                } else {
                    // Desktop ou mobile après swipe : appliquer la vitesse avec décélération
                    if (isMobile && speedRef.current !== 0) {
                        // En mobile : décélération plus rapide pour un mouvement plus contrôlé
                        speedRef.current *= 0.92; // Réduire de 8% à chaque frame (décélération plus rapide)
                        targetSpeed.current = speedRef.current;
                    } else {
                        // Desktop : interpolation douce
                        speedRef.current += (targetSpeed.current - speedRef.current) * 0.08;
                    }

                    // Seuil d'arrêt pour une décélération naturelle
                    if (Math.abs(speedRef.current) < 0.1) {
                        speedRef.current = 0;
                        targetSpeed.current = 0;
                    }

                    if (speedRef.current !== 0) {
                        setItems((prev) => {
                            // Utiliser une boucle for pour de meilleures performances
                            const newItems = new Array(prev.length);
                            for (let i = 0; i < prev.length; i++) {
                                let newX = prev[i].x - speedRef.current;
                                if (newX < minX) newX += totalWidth;
                                else if (newX > maxX) newX -= totalWidth;
                                newItems[i] = { ...prev[i], x: newX };
                            }
                            return newItems;
                        });
                    }
                }
            }

            animationRef.current = requestAnimationFrame(loop);
        };

        animationRef.current = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(animationRef.current);
            if (centerPauseTimeout.current) clearTimeout(centerPauseTimeout.current);
        };
    }, [videos, items.length, dimensions, isMobile, isTablet]);

    const handleMouseMove = (e) => {
        // Libérer le verrouillage dès qu'on bouge la souris (sauf pendant l'auto-centrage)
        if (!isAutoCentering.current && targetItemRef.current) {
            targetItemRef.current = null;
        }

        if (isAutoCentering.current) return; // Bloquer seulement pendant l'animation de centrage

        const rect = containerRef.current.getBoundingClientRect();
        const center = rect.width / 2;
        const distance = e.clientX - rect.left - center;
        // Limiter la vitesse maximale à partir de 1440px de largeur pour éviter que ça aille trop vite
        const screenWidth = window.innerWidth;
        const maxSpeed = screenWidth >= 1440 ? 15 : 20; // Vitesse réduite à 15 pour les écrans >= 1440px
        const deadZone = 50;

        if (Math.abs(distance) > deadZone) {
            const normalized = (Math.abs(distance) - deadZone) / (center - deadZone);
            const direction = Math.sign(distance);
            targetSpeed.current = direction * maxSpeed * normalized ** 2;
        } else {
            targetSpeed.current = 0;
        }
    };

    const handleMouseLeave = () => {
        // Réinitialiser la vitesse quand la souris sort
        targetSpeed.current = 0;
    };

    const touchX = useRef(null);
    const lastTouchX = useRef(null);
    const touchStartTime = useRef(null);
    const touchStartX = useRef(null);
    const isDragging = useRef(false);
    const lastMoveTime = useRef(null);
    const velocities = useRef([]); // Stocker les dernières vitesses pour calculer la moyenne
    const dragAnimationFrame = useRef(null);
    const itemsPositionsRef = useRef(null); // Référence pour les positions pendant le drag

    const handleTouchStart = (e) => {
        // Libérer le verrouillage dès qu'on touche (sauf pendant l'auto-centrage)
        if (!isAutoCentering.current && targetItemRef.current) {
            targetItemRef.current = null;
        }

        if (isAutoCentering.current) return; // Bloquer seulement pendant l'animation de centrage

        const touch = e.touches[0];
        touchX.current = touch.clientX;
        lastTouchX.current = touch.clientX;
        touchStartX.current = touch.clientX;
        touchStartTime.current = Date.now();
        lastMoveTime.current = Date.now();
        isDragging.current = true;
        velocities.current = [];

        // Stocker les positions actuelles pour éviter les re-renders inutiles
        itemsPositionsRef.current = items.map(item => ({ ...item }));

        // Arrêter tout mouvement automatique en mobile
        if (isMobile) {
            targetSpeed.current = 0;
            speedRef.current = 0;
        }
    };

    const updateItemsPositions = (delta) => {
        if (!itemsPositionsRef.current) return;

        const totalWidth = (dimensions.cardWidth + dimensions.gap) * videoList.length;
        const cardWidthPlusGap = dimensions.cardWidth + dimensions.gap;
        const minX = -cardWidthPlusGap;
        const maxX = totalWidth - dimensions.cardWidth;

        // Mettre à jour les positions dans la ref de manière optimisée avec une boucle for
        const newPositions = new Array(itemsPositionsRef.current.length);
        for (let i = 0; i < itemsPositionsRef.current.length; i++) {
            let newX = itemsPositionsRef.current[i].x + delta;
            // Gérer le loop de manière optimisée
            if (newX < minX) newX += totalWidth;
            else if (newX > maxX) newX -= totalWidth;
            newPositions[i] = { ...itemsPositionsRef.current[i], x: newX };
        }

        itemsPositionsRef.current = newPositions;

        // Mettre à jour l'état de manière optimisée
        setItems(newPositions);
    };

    const handleTouchMove = (e) => {
        if (isAutoCentering.current) return; // Bloquer seulement pendant l'animation de centrage

        if (isMobile && isDragging.current) {
            const currentX = e.touches[0].clientX;
            const currentTime = performance.now(); // Utiliser performance.now() pour plus de précision
            const delta = currentX - lastTouchX.current;

            // Calculer la vitesse pour l'animation fluide
            if (lastMoveTime.current && currentTime - lastMoveTime.current > 0) {
                const timeDelta = currentTime - lastMoveTime.current;
                const velocity = delta / timeDelta;
                velocities.current.push(velocity);
                // Garder seulement les 5 dernières vitesses pour un calcul plus précis
                if (velocities.current.length > 5) {
                    velocities.current.shift();
                }
            }

            // Mettre à jour directement sans requestAnimationFrame pour une réactivité immédiate
            // Cela évite les conflits avec la boucle principale
            updateItemsPositions(delta);

            lastTouchX.current = currentX;
            lastMoveTime.current = currentTime;
        } else {
            // Desktop : comportement original avec vitesse
            const delta = e.touches[0].clientX - lastTouchX.current;
            targetSpeed.current = -delta * 2.5;
            lastTouchX.current = e.touches[0].clientX;
        }
    };

    const handleTouchEnd = () => {
        // Annuler l'animation frame en cours
        if (dragAnimationFrame.current) {
            cancelAnimationFrame(dragAnimationFrame.current);
            dragAnimationFrame.current = null;
        }

        if (isMobile && isDragging.current) {
            isDragging.current = false;

            // Calculer la vitesse moyenne pour l'animation fluide après le swipe
            if (velocities.current.length > 0) {
                // Utiliser une moyenne pondérée pour donner plus de poids aux vitesses récentes
                const recentVelocities = velocities.current.slice(-3); // 3 dernières vitesses
                const avgVelocity = recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;

                // Convertir en pixels par frame (environ 60fps = 16.67ms par frame)
                // Réduire le facteur pour une vitesse plus contrôlée et fluide
                const velocityPerFrame = avgVelocity * 16.67 * 0.5; // Facteur réduit à 0.5 pour moins de vitesse

                // Appliquer une vitesse initiale basée sur le geste pour décélération fluide
                // Seuil réduit pour éviter les mouvements trop petits
                if (Math.abs(velocityPerFrame) > 0.3) {
                    // Négatif car dans la boucle on fait item.x - speedRef.current
                    targetSpeed.current = -velocityPerFrame;
                    speedRef.current = -velocityPerFrame;
                } else {
                    targetSpeed.current = 0;
                    speedRef.current = 0;
                }
            } else {
                targetSpeed.current = 0;
                speedRef.current = 0;
            }
        } else {
            // Desktop : réinitialiser la vitesse à la fin du touch
            targetSpeed.current = 0;
        }

        touchX.current = null;
        lastTouchX.current = null;
        touchStartX.current = null;
        touchStartTime.current = null;
        lastMoveTime.current = null;
        velocities.current = [];
        itemsPositionsRef.current = null;
    };

    const handleClick = (item) => {
        if (!containerRef.current || items.length === 0) return;

        // Annuler toute action en cours
        if (centerPauseTimeout.current) clearTimeout(centerPauseTimeout.current);

        // Libérer la cible précédente si on clique sur une nouvelle image
        targetItemRef.current = item;
        isAutoCentering.current = true;

        onSelectVideo(item);
    };

    useEffect(() => {
        if (!containerRef.current || !items.length || dimensions.cardWidth === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const center = rect.width / 2;

        let closest = null;
        let minDist = Infinity;

        items.forEach((item) => {
            const itemCenter = item.x + dimensions.cardWidth / 2;
            const distance = Math.abs(itemCenter - center);
            if (distance < minDist) {
                minDist = distance;
                closest = item;
            }
        });

        setCenterVideo(closest);
    }, [items, dimensions]);

    // Debug : afficher les dimensions
    console.log('Carrousel state:', {
        videoListLength: videoList.length,
        cardWidth: dimensions.cardWidth,
        cardHeight: dimensions.cardHeight,
        gap: dimensions.gap,
        itemsLength: items.length,
        isMobile,
        isTablet
    });

    // Ne pas rendre si pas de vidéos ou dimensions invalides
    if (!videoList.length) {
        return (
            <div className="w-full relative md:mb-0 md:mt-0" style={{ overflow: 'visible', minHeight: '200px' }}>
                <div className="relative bg-transparent" style={{ height: '200px' }}>
                    <p className="text-center text-gray-500 pt-8">Aucune vidéo disponible</p>
                </div>
            </div>
        );
    }

    if (dimensions.cardWidth <= 0 || !dimensions.cardWidth) {
        return (
            <div className="w-full relative md:mb-0 md:mt-0" style={{ overflow: 'visible', minHeight: '200px' }}>
                <div className="relative bg-transparent" style={{ height: '200px' }}>
                    <p className="text-center text-gray-500 pt-8">Calcul des dimensions...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full relative"
            style={{
                overflow: (isMobile && !isLandscape) ? 'hidden' : 'visible',
                minHeight: '200px',
                paddingLeft: isMobile ? '20px' : '0',
                paddingRight: isMobile ? '20px' : '0',
                marginTop: isMobile ? '0' : '5px',
                marginBottom: isMobile ? '0' : '19px', // marginTop (2px) + navbarSpacing (17px)
                boxSizing: 'border-box'
            }}
        >
            <div
                ref={containerRef}
                className="relative bg-transparent cursor-pointer"
                style={{
                    height: `${dimensions.containerHeight || (dimensions.cardHeight + 8 + 50)}px`, // Image + margin-top + titre (adaptatif en mobile)
                    minHeight: isMobile ? `${dimensions.cardHeight + 11 + 40}px` : '200px', // En mobile : image + margin-top (11px) + titre (40px)
                    width: '100%',
                    overflow: (isMobile && !isLandscape) ? 'hidden' : 'visible',
                    transform: 'translateZ(0)', // Force l'accélération matérielle pour la fluidité
                    WebkitTransform: 'translateZ(0)'
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {items.length > 0 ? items.map((item, i) => {
                    // Toutes les images ont la même largeur et hauteur
                    const itemWidth = dimensions.cardWidth;
                    const itemHeight = dimensions.cardHeight;
                    const itemX = item.x;

                    return (
                        <div
                            key={item.id + "-" + i}
                            className="absolute"
                            style={{
                                left: 0,
                                transform: `translateX(${itemX}px)`,
                                width: `${itemWidth}px`,
                                bottom: "0px",
                                zIndex: 50,
                                willChange: "transform",
                                overflow: 'visible',
                                backfaceVisibility: 'hidden', // Optimisation pour la fluidité
                                WebkitBackfaceVisibility: 'hidden'
                            }}
                        >
                            <img
                                src={item.thumbnail || item.url}
                                alt={item.title || item.alt}
                                onClick={() => handleClick(item)}
                                className="w-full cursor-pointer"
                                style={{
                                    height: `${itemHeight}px`,
                                    objectFit: "cover",
                                }}
                            />
                            <div
                                className="text-center font-HelveticaNeue font-light whitespace-nowrap text-grey-darker"
                                style={{
                                    opacity: 1,
                                    marginTop: isMobile ? "11px" : "8px",
                                    fontSize: isMobile ? "12px" : `${TITLE_FONT_SIZE}px`,
                                    borderBottom: selectedVideo && selectedVideo.id === item.id ? '0.5px solid currentColor' : 'none',
                                    paddingBottom: selectedVideo && selectedVideo.id === item.id ? '1px' : '0',
                                    display: 'block',
                                    textAlign: 'center',
                                    position: 'relative',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 'auto',
                                    maxWidth: 'none'
                                }}
                            >
                                {item.title || item.alt || ""}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        Aucune vidéo disponible
                    </div>
                )}
            </div>
        </div>
    );
}