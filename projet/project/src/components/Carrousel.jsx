import { useRef, useEffect, useState } from "react";

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
        cardHeight: BASE_CARD_HEIGHT
    });
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

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
                // Mobile : images plus grandes avec gap réduit
                const mobilePadding = 20; // Espace à gauche et à droite (40px au total)
                const availableWidth = containerWidth - (2 * mobilePadding); // Largeur disponible moins les marges
                const totalGaps = 2; // 2 gaps pour 3 images
                const availableWidthForCards = Math.max(0, availableWidth - (totalGaps * BASE_GAP_MOBILE));
                const baseCardWidth = availableWidthForCards / 3; // Largeur de base pour 3 images

                // Augmenter la taille des images (multiplicateur pour les rendre plus grandes)
                const sizeMultiplier = 1.15; // +15% pour rendre les images plus grandes
                const scaledCardWidth = baseCardWidth * sizeMultiplier;

                // Utiliser cette largeur si elle permet toujours 3 images
                // Sinon, ajuster pour garantir 3 images
                const maxWidthFor3 = (availableWidth - (totalGaps * BASE_GAP_MOBILE)) / 3;
                finalCardWidth = Math.min(scaledCardWidth, maxWidthFor3);

                // Limiter la taille maximale pour éviter que les images soient trop grandes près de 820px
                const MAX_CARD_WIDTH_MOBILE = 120; // Largeur maximale pour les images en mobile (réduite pour voir les titres)
                finalCardWidth = Math.min(finalCardWidth, MAX_CARD_WIDTH_MOBILE);

                // S'assurer que la largeur est valide et positive
                if (finalCardWidth <= 0 || !isFinite(finalCardWidth)) {
                    finalCardWidth = BASE_CARD_WIDTH; // Valeur par défaut
                }
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
                        cardHeight: 186 // Hauteur fixe de 186px
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
                cardHeight: finalCardHeight
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

        // Pour mobile, ajouter une marge à gauche pour centrer les 3 images visibles
        let startX = 0;
        if (isMobile) {
            const mobilePadding = 20; // Même padding que dans le calcul des dimensions
            const totalWidthFor3Items = (3 * cardWidth) + (2 * gap); // 3 images + 2 gaps
            startX = mobilePadding; // Commencer après la marge gauche
        }

        const initialPositions = videoList.map((v, i) => {
            const x = startX + i * (cardWidth + gap);
            return { ...v, x };
        });
        setItems(initialPositions);
    }, [videos, dimensions, isMobile]);

    useEffect(() => {
        if (dimensions.cardWidth === 0) return;

        // Calculer totalWidth
        const totalWidth = (dimensions.cardWidth + dimensions.gap) * videoList.length;

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

                    // Toutes les images ont la même largeur maintenant
                    const itemWidth = dimensions.cardWidth;
                    const itemCenter = currentItem.x + itemWidth / 2;
                    let distance = center - itemCenter;

                    if (distance > totalWidth / 2) distance -= totalWidth;
                    if (distance < -totalWidth / 2) distance += totalWidth;

                    if (Math.abs(distance) < 0.5) {
                        isAutoCentering.current = false;
                        targetSpeed.current = 0;

                        // Ne pas libérer automatiquement - rester centré
                        // centerPauseTimeout.current = setTimeout(() => {
                        //   targetItemRef.current = null;
                        // }, 500);

                        return prev;
                    }

                    const speed = distance * 0.1;

                    return prev.map((item) => {
                        let newX = item.x + speed;
                        if (newX < -dimensions.cardWidth - dimensions.gap) newX += totalWidth;
                        if (newX > totalWidth - dimensions.cardWidth) newX -= totalWidth;
                        return { ...item, x: newX };
                    });
                });
            }

            if (!isAutoCentering.current && !targetItemRef.current) {
                speedRef.current += (targetSpeed.current - speedRef.current) * 0.08;

                if (Math.abs(speedRef.current) < 0.01) speedRef.current = 0;

                if (speedRef.current !== 0) {
                    setItems((prev) =>
                        prev.map((item) => {
                            let newX = item.x - speedRef.current;
                            if (newX < -dimensions.cardWidth - dimensions.gap) newX += totalWidth;
                            if (newX > totalWidth - dimensions.cardWidth) newX -= totalWidth;
                            return { ...item, x: newX };
                        })
                    );
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
        const maxSpeed = 20;
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

    const handleTouchStart = (e) => {
        // Libérer le verrouillage dès qu'on touche (sauf pendant l'auto-centrage)
        if (!isAutoCentering.current && targetItemRef.current) {
            targetItemRef.current = null;
        }

        if (isAutoCentering.current) return; // Bloquer seulement pendant l'animation de centrage

        touchX.current = e.touches[0].clientX;
        lastTouchX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        if (isAutoCentering.current) return; // Bloquer seulement pendant l'animation de centrage

        const delta = e.touches[0].clientX - lastTouchX.current;
        // Vitesse augmentée pour mobile (2.5x au lieu de 1.2x)
        targetSpeed.current = -delta * 2.5;
        lastTouchX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        // Réinitialiser la vitesse à la fin du touch
        targetSpeed.current = 0;
        touchX.current = null;
        lastTouchX.current = null;
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
                overflow: isMobile ? 'hidden' : 'visible',
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
                    height: `${dimensions.cardHeight + 8 + 50}px`, // Image + margin-top (8px) + titre (~50px pour s'assurer que les titres sont visibles)
                    minHeight: '200px',
                    width: '100%',
                    overflow: isMobile ? 'hidden' : 'visible'
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
                                left: `${itemX}px`,
                                width: `${itemWidth}px`,
                                bottom: "0px",
                                zIndex: 50,
                                willChange: "transform, opacity",
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
                                    width: '100%'
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