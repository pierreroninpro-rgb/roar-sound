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

    // Dimensions uniformes
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

            const mobile = containerWidth <= 820;
            const tablet = containerWidth > 820 && containerWidth < 1024;
            const tabletLarge = containerWidth >= 900 && containerWidth < 1024;
            setIsMobile(mobile);
            setIsTablet(tablet);
            const visibleItems = mobile ? VISIBLE_ITEMS_MOBILE : (tabletLarge ? VISIBLE_ITEMS_TABLET_LARGE : (tablet ? VISIBLE_ITEMS_TABLET : VISIBLE_ITEMS_DESKTOP));

            let finalCardWidth;

            if (mobile) {
                const mobilePadding = 20;
                const availableWidth = containerWidth - (2 * mobilePadding);
                const totalGaps = 2;
                const availableWidthForCards = Math.max(0, availableWidth - (totalGaps * BASE_GAP_MOBILE));
                const baseCardWidth = availableWidthForCards / 3;

                const sizeMultiplier = 1.15;
                const scaledCardWidth = baseCardWidth * sizeMultiplier;

                const maxWidthFor3 = (availableWidth - (totalGaps * BASE_GAP_MOBILE)) / 3;
                finalCardWidth = Math.min(scaledCardWidth, maxWidthFor3);

                const MAX_CARD_WIDTH_MOBILE = 120;
                finalCardWidth = Math.min(finalCardWidth, MAX_CARD_WIDTH_MOBILE);

                if (finalCardWidth <= 0 || !isFinite(finalCardWidth)) {
                    finalCardWidth = BASE_CARD_WIDTH;
                }
            } else {
                const totalGaps = visibleItems - 1;
                const availableWidthForCards = Math.max(0, containerWidth - (totalGaps * BASE_GAP));
                const uniformCardWidth = availableWidthForCards / visibleItems;

                finalCardWidth = uniformCardWidth;

                if (finalCardWidth <= 0 || !isFinite(finalCardWidth)) {
                    finalCardWidth = BASE_CARD_WIDTH;
                }
            }

            const aspectRatio = BASE_CARD_HEIGHT / BASE_CARD_WIDTH;
            let finalCardHeight = finalCardWidth * aspectRatio;

            if (!mobile) {
                finalCardHeight += 5;
            }

            setDimensions({
                cardWidth: finalCardWidth,
                gap: mobile ? BASE_GAP_MOBILE : BASE_GAP,
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

    // ✅ FIX : Initialisation des positions avec duplication (3 copies) pour boucle infinie fluide
    useEffect(() => {
        if (!videoList.length || dimensions.cardWidth === 0) return;

        const gap = dimensions.gap;
        const cardWidth = dimensions.cardWidth;
        const singleSetWidth = (cardWidth + gap) * videoList.length;

        let startX = 0;
        if (isMobile) {
            const mobilePadding = 20;
            startX = mobilePadding;
        }

        // Dupliquer les items 3 fois pour une boucle continue sans zones blanches
        const initialPositions = [];
        for (let copy = 0; copy < 3; copy++) {
            videoList.forEach((v, i) => {
                const x = startX + (copy * singleSetWidth) + i * (cardWidth + gap);
                initialPositions.push({ ...v, id: `${v.id}-copy-${copy}`, originalId: v.id, x });
            });
        }
        
        setItems(initialPositions);
    }, [videos, dimensions, isMobile]);

    // ✅ FIX : Boucle d'animation optimisée sans saccades
    useEffect(() => {
        if (dimensions.cardWidth === 0 || items.length === 0) return;

        // Calculer la largeur d'un seul set (avec duplication ×3)
        const stride = dimensions.cardWidth + dimensions.gap;
        const setWidth = stride * videoList.length; // Largeur d'UNE copie
        
        // Centraliser les bornes de recyclage (calculées une seule fois)
        const startX = isMobile ? 20 : 0;
        const minX = startX - setWidth; // Limite gauche (sortie du set 0)
        const maxX = startX + setWidth * 2; // Limite droite (sortie du set 2)
        
        let lastTime = performance.now();

        const loop = (currentTime) => {
            if (!containerRef.current || items.length === 0) {
                animationRef.current = requestAnimationFrame(loop);
                return;
            }

            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            // Normaliser le deltaTime pour éviter les saccades sur les écrans à faible framerate
            const normalizedDelta = Math.min(deltaTime / 16.67, 2.0); // 16.67ms = 60fps

            if (isAutoCentering.current && targetItemRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const center = rect.width / 2;

                setItems((prev) => {
                    // Trouver la copie la plus proche du centre pour l'item ciblé
                    const rect = containerRef.current.getBoundingClientRect();
                    const center = rect.width / 2;
                    const targetOriginalId = targetItemRef.current.originalId || targetItemRef.current.id;
                    
                    // Trouver toutes les copies de cet item
                    const copies = prev.filter((v) => (v.originalId || v.id) === targetOriginalId);
                    if (copies.length === 0) return prev;
                    
                    // Trouver la copie la plus proche du centre
                    let currentItem = copies[0];
                    let minDist = Math.abs((currentItem.x + dimensions.cardWidth / 2) - center);
                    copies.forEach((copy) => {
                        const dist = Math.abs((copy.x + dimensions.cardWidth / 2) - center);
                        if (dist < minDist) {
                            minDist = dist;
                            currentItem = copy;
                        }
                    });
                    
                    if (!currentItem) return prev;

                    const itemWidth = dimensions.cardWidth;
                    const itemCenter = currentItem.x + itemWidth / 2;
                    let distance = center - itemCenter;

                    // Normaliser la distance pour choisir le chemin le plus court (basé sur setWidth)
                    if (distance > setWidth / 2) distance -= setWidth;
                    if (distance < -setWidth / 2) distance += setWidth;

                    if (Math.abs(distance) < 0.5) {
                        isAutoCentering.current = false;
                        targetSpeed.current = 0;
                        return prev;
                    }

                    // Vitesse normalisée par le deltaTime pour une animation fluide
                    const speed = distance * 0.1 * normalizedDelta;

                    return prev.map((item) => {
                        let newX = item.x + speed;
                        
                        // ✅ Boucle infinie avec duplication ×3 - recyclage basé sur setWidth
                        // Trop à gauche → on pousse de 3 sets à droite (retour au set 2)
                        if (newX < minX) {
                            newX += setWidth * 3;
                        }
                        // Trop à droite → on tire de 3 sets à gauche (retour au set 0)
                        if (newX > maxX) {
                            newX -= setWidth * 3;
                        }
                        
                        return { ...item, x: newX };
                    });
                });
            } else {
                // ✅ Interpolation douce de la vitesse avec facteur amélioré (0.12 au lieu de 0.08)
                speedRef.current += (targetSpeed.current - speedRef.current) * 0.12;

                if (Math.abs(speedRef.current) < 0.01) {
                    speedRef.current = 0;
                }

                if (Math.abs(speedRef.current) > 0.001) {
                    // Appliquer la vitesse normalisée par le deltaTime
                    const appliedSpeed = speedRef.current * normalizedDelta;
                    
                    setItems((prev) =>
                        prev.map((item) => {
                            let newX = item.x - appliedSpeed;
                            
                            // ✅ Boucle infinie avec duplication ×3 - recyclage basé sur setWidth
                            // Trop à gauche → on pousse de 3 sets à droite (retour au set 2)
                            if (newX < minX) {
                                newX += setWidth * 3;
                            }
                            // Trop à droite → on tire de 3 sets à gauche (retour au set 0)
                            if (newX > maxX) {
                                newX -= setWidth * 3;
                            }
                            
                            return { ...item, x: newX };
                        })
                    );
                }
            }

            animationRef.current = requestAnimationFrame(loop);
        };

        animationRef.current = requestAnimationFrame(loop);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (centerPauseTimeout.current) {
                clearTimeout(centerPauseTimeout.current);
            }
        };
    }, [items.length, dimensions, videoList.length]);

    const handleMouseMove = (e) => {
        // Désactiver sur mobile
        if (isMobile) return;
        
        if (!isAutoCentering.current && targetItemRef.current) {
            targetItemRef.current = null;
        }

        if (isAutoCentering.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const containerWidth = rect.width;
        const center = containerWidth / 2;
        const distance = e.clientX - rect.left - center;
        const maxSpeed = 12; // Ajusté à 12 pour un bon équilibre (entre 8 et 20)
        const deadZone = 50;

        if (Math.abs(distance) > deadZone) {
            // Limiter la largeur effective à 1024px pour les écrans plus grands
            // Cela permet de plafonner la vitesse à celle d'un écran de 1024px
            const effectiveWidth = Math.min(containerWidth, 1024);
            const effectiveCenter = effectiveWidth / 2;
            
            // Calculer la distance normalisée basée sur la largeur effective
            const normalized = (Math.abs(distance) - deadZone) / (effectiveCenter - deadZone);
            // Limiter la normalisation à 1.0 pour éviter les vitesses excessives
            const clampedNormalized = Math.min(normalized, 1.0);
            const direction = Math.sign(distance);
            targetSpeed.current = direction * maxSpeed * clampedNormalized ** 2;
        } else {
            targetSpeed.current = 0;
        }
    };

    const handleMouseLeave = () => {
        // Désactiver sur mobile
        if (isMobile) return;
        targetSpeed.current = 0;
    };

    const touchX = useRef(null);
    const lastTouchX = useRef(null);
    const touchStartTime = useRef(null);
    const isSwiping = useRef(false);

    const handleTouchStart = (e) => {
        if (!isAutoCentering.current && targetItemRef.current) {
            targetItemRef.current = null;
        }

        if (isAutoCentering.current) return;

        touchX.current = e.touches[0].clientX;
        lastTouchX.current = e.touches[0].clientX;
        touchStartTime.current = Date.now();
        isSwiping.current = false;
        
        // Arrêter le mouvement en cours
        targetSpeed.current = 0;
        speedRef.current = 0;
    };

    const handleTouchMove = (e) => {
        if (isAutoCentering.current) return;
        if (!touchX.current) return;

        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchX.current;
        
        // Détecter si c'est un vrai swipe (mouvement horizontal significatif)
        if (Math.abs(deltaX) > 10) {
            isSwiping.current = true;
            // Empêcher le scroll de la page pendant le swipe
            e.preventDefault();
        }

        if (isSwiping.current) {
            const delta = currentX - lastTouchX.current;
            
            // Réduire la sensibilité du mouvement sur mobile (facteur 0.7)
            const reducedDelta = delta * 0.7;
            
            // Déplacer directement les items sans inertie
            const stride = dimensions.cardWidth + dimensions.gap;
            const setWidth = stride * videoList.length; // Largeur d'UNE copie
            const startX = isMobile ? 20 : 0;
            const minX = startX - setWidth; // Limite gauche (sortie du set 0)
            const maxX = startX + setWidth * 2; // Limite droite (sortie du set 2)
            
            setItems((prev) =>
                prev.map((item) => {
                    let newX = item.x + reducedDelta;
                    
                    // ✅ Boucle infinie avec duplication ×3 - recyclage basé sur setWidth
                    // Trop à gauche → on pousse de 3 sets à droite (retour au set 2)
                    if (newX < minX) {
                        newX += setWidth * 3;
                    }
                    // Trop à droite → on tire de 3 sets à gauche (retour au set 0)
                    if (newX > maxX) {
                        newX -= setWidth * 3;
                    }
                    
                    return { ...item, x: newX };
                })
            );
        }
        
        lastTouchX.current = currentX;
    };

    const handleTouchEnd = () => {
        if (!touchX.current) return;
        
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime.current;
        const deltaX = lastTouchX.current - touchX.current;
        
        // Si c'est un swipe rapide, ajouter de l'inertie
        if (isSwiping.current && touchDuration < 300 && Math.abs(deltaX) > 30) {
            const velocity = deltaX / touchDuration;
            // Réduire la vitesse mobile (de 100 à 30 pour ralentir significativement)
            targetSpeed.current = -velocity * 30;
            
            // Décélérer progressivement
            const decelerate = () => {
                targetSpeed.current *= 0.95;
                if (Math.abs(targetSpeed.current) < 0.5) {
                    targetSpeed.current = 0;
                }
            };
            
            const decelerateInterval = setInterval(() => {
                decelerate();
                if (targetSpeed.current === 0) {
                    clearInterval(decelerateInterval);
                }
            }, 16);
        } else {
            targetSpeed.current = 0;
        }
        
        touchX.current = null;
        lastTouchX.current = null;
        touchStartTime.current = null;
        isSwiping.current = false;
    };

    const handleClick = (item) => {
        if (!containerRef.current || items.length === 0) return;

        if (centerPauseTimeout.current) clearTimeout(centerPauseTimeout.current);

        // Trouver l'item original pour onSelectVideo
        const originalItem = videoList.find((v) => v.id === (item.originalId || item.id));
        const itemToSelect = originalItem || item;

        targetItemRef.current = item; // Garder la copie pour le centrage
        isAutoCentering.current = true;

        onSelectVideo(itemToSelect);
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

        // Utiliser l'item original (sans la copie) pour setCenterVideo
        if (closest) {
            const originalItem = videoList.find((v) => v.id === (closest.originalId || closest.id));
            setCenterVideo(originalItem || closest);
        } else {
            setCenterVideo(null);
        }
    }, [items, dimensions, videoList]);

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
                    const itemWidth = dimensions.cardWidth;
                    const itemHeight = dimensions.cardHeight;
                    const itemX = item.x;

                    return (
                        <div
                            key={`${item.id}-${i}`}
                            className="absolute"
                            style={{
                                left: `${itemX}px`,
                                width: `${itemWidth}px`,
                                bottom: "0px",
                                zIndex: 50,
                                willChange: "transform",
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
                                className="text-center font-HelveticaNeue font-light whitespace-nowrap pt-2 text-grey-darker"
                                style={{
                                    opacity: 1,
                                    marginTop: isMobile ? "11px" : "8px",
                                    fontSize: isMobile ? "12px" : `${TITLE_FONT_SIZE}px`,
                                    borderBottom: selectedVideo && selectedVideo.id === (item.originalId || item.id) ? '0.5px solid currentColor' : 'none',
                                    paddingBottom: selectedVideo && selectedVideo.id === (item.originalId || item.id) ? '1px' : '0',
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