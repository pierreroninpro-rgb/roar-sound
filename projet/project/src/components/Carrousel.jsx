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
    const BASE_CARD_WIDTH = 100;
    const BASE_GAP = 70;
    const BASE_GAP_MOBILE = 30;
    const BASE_CARD_HEIGHT = 140;
    const TITLE_FONT_SIZE = 16;

    const VISIBLE_ITEMS_DESKTOP = 9;
    const VISIBLE_ITEMS_TABLET = 5;
    const VISIBLE_ITEMS_TABLET_LARGE = 7;
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
            const containerWidth = containerRef.current
                ? containerRef.current.getBoundingClientRect().width || window.innerWidth
                : window.innerWidth;

            if (containerWidth === 0 || !containerWidth) {
                if (containerRef.current) {
                    requestAnimationFrame(calculateDimensions);
                }
                return;
            }

            // Mobile : uniquement les vrais téléphones (≤ 500px)
            const mobile = containerWidth <= 500;
            // Tablette/petit desktop : entre 500px et 1024px → 5 images
            const tablet = containerWidth > 500 && containerWidth < 1024;
            const tabletLarge = containerWidth >= 900 && containerWidth < 1024; // Zone avec 7 images
            setIsMobile(mobile);
            setIsTablet(tablet);
            const visibleItems = mobile ? VISIBLE_ITEMS_MOBILE : (tabletLarge ? VISIBLE_ITEMS_TABLET_LARGE : (tablet ? VISIBLE_ITEMS_TABLET : VISIBLE_ITEMS_DESKTOP));

            let finalCardWidth;
            let finalCardHeight;
            let finalGap;

            if (mobile) {
                // Mobile : dimensions fixes 79px × 141px
                finalCardWidth = 79; // Largeur fixe de 79px
                finalCardHeight = 141; // Hauteur fixe de 141px

                // Calculer le gap pour que 3 images soient visibles
                const mobilePadding = 20; // Espace à gauche et à droite (40px au total)
                const availableWidth = containerWidth - (2 * mobilePadding); // Largeur disponible moins les marges
                const totalImagesWidth = 3 * 79; // 237px pour 3 images
                const numberOfGaps = 2; // 2 gaps pour 3 images
                const calculatedGap = (availableWidth - totalImagesWidth) / numberOfGaps;

                // Utiliser le gap calculé, avec une valeur minimale de sécurité
                finalGap = Math.max(calculatedGap, BASE_GAP_MOBILE);
            } else {
                // Desktop et Tablette (5 et 7 images) : dimensions fixes 105px × 186px
                finalCardWidth = 105; // Largeur fixe de 105px
                finalCardHeight = 186; // Hauteur fixe de 186px

                // Calculer le gap pour que le nombre d'images visibles soit respecté
                const totalImagesWidth = visibleItems * 105;
                const numberOfGaps = visibleItems - 1; // Nombre de gaps entre les images visibles
                const calculatedGap = (containerWidth - totalImagesWidth) / numberOfGaps;

                // Utiliser le gap calculé, avec une valeur minimale de sécurité
                finalGap = Math.max(calculatedGap, 20); // Gap minimum de 20px

                // Si le conteneur est vraiment trop petit, on garde quand même un gap raisonnable
                if (calculatedGap < 0) {
                    console.warn(`Conteneur trop petit (${containerWidth}px) pour ${visibleItems} images de 105px. Gap ajusté à 20px.`);
                }
            }

            setDimensions({
                cardWidth: finalCardWidth,
                gap: finalGap,
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
        const rawDistance = e.clientX - rect.left - center;
        const maxSpeed = 16;
        const deadZone = 50;

        if (Math.abs(rawDistance) > deadZone) {
            // Limiter la largeur utilisée pour le calcul à 1400px maximum
            // Pour les écrans plus grands, utiliser la moitié de 1400px (700px) comme référence
            const maxWidth = 1600;
            const maxCenter = maxWidth / 2; // Toujours 700px pour 1400px
            const maxDistanceFromCenter = maxCenter - deadZone; // Distance maximale utilisable depuis le centre (650px)
            
            // Limiter la distance des deux côtés (gauche et droite) par rapport au centre
            // Pour garder la même vitesse maximale au-delà de 1400px
            const absDistance = Math.abs(rawDistance);
            const limitedAbsDistance = Math.min(absDistance, maxDistanceFromCenter + deadZone);
            const limitedDistance = Math.sign(rawDistance) * limitedAbsDistance;
            
            // Normaliser en utilisant la distance maximale depuis le centre
            const normalized = (limitedAbsDistance - deadZone) / maxDistanceFromCenter;
            const direction = Math.sign(limitedDistance);
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

        // acceleration ou diminution du carrousel version mobile
        const delta = e.touches[0].clientX - lastTouchX.current;
        // Vitesse réduite pour mobile (0.8x pour moins de sensibilité)
        targetSpeed.current = -delta * 1.5;
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

        // Ne pas permettre de cliquer sur l'image déjà sélectionnée
        if (selectedVideo && selectedVideo.id === item.id) {
            return;
        }

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
            className="w-full relative md:mb-0 md:mt-0"
            style={{
                overflow: isMobile ? 'hidden' : 'visible',
                minHeight: '200px',
                paddingLeft: isMobile ? '20px' : '0',
                paddingRight: isMobile ? '20px' : '0',
                boxSizing: 'border-box'
            }}
        >
            <div
                ref={containerRef}
                className="relative bg-transparent cursor-pointer"
                style={{
                    height: `${dimensions.cardHeight + 8 + 50}px`,
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
                    const isSelected = selectedVideo && selectedVideo.id === item.id;

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
                                src={item.thumbnail || item.url || '/images/default.png'}
                                alt={item.title || item.alt}
                                onClick={() => handleClick(item)}
                                onTouchStart={(e) => {
                                    // Empêcher le touch sur l'image sélectionnée
                                    if (isSelected) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                    }
                                    handleClick(item);
                                }}
                                className={`w-full ${isSelected ? 'cursor-default' : 'cursor-pointer'}`}
                                style={{
                                    height: `${itemHeight}px`,
                                    objectFit: "cover",
                                    pointerEvents: isSelected ? 'none' : 'auto',
                                }}
                                onError={(e) => {
                                    e.target.src = '/images/default.png';
                                }}
                            />
                            <div
                                className="text-center font-HelveticaNeue font-light pt-2 text-grey-darker"
                                style={{
                                    opacity: 1,
                                    marginTop: isMobile ? "11px" : "8px",
                                    fontSize: isMobile ? "12px" : `${TITLE_FONT_SIZE}px`,
                                    borderBottom: selectedVideo && selectedVideo.id === item.id ? '0.5px solid currentColor' : 'none',
                                    paddingBottom: selectedVideo && selectedVideo.id === item.id ? '1px' : '0',
                                    display: 'block',
                                    textAlign: 'center',
                                    width: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
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