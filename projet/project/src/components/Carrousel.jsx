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

    useEffect(() => {
        if (!videoList.length || dimensions.cardWidth === 0) return;

        const gap = dimensions.gap;
        const cardWidth = dimensions.cardWidth;

        let startX = 0;
        if (isMobile) {
            const mobilePadding = 20;
            startX = mobilePadding;
        }

        // Initialiser avec les positions de base
        const initialPositions = videoList.map((v, i) => {
            const x = startX + i * (cardWidth + gap);
            return { ...v, x, originalId: v.id };
        });
        setItems(initialPositions);
    }, [videos, dimensions, isMobile]);

    useEffect(() => {
        if (dimensions.cardWidth === 0 || !videoList.length) return;

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
                    const currentItem = prev.find((v) => v.originalId === itemToCenter.originalId);
                    if (!currentItem) return prev;

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
                        
                        // Wrapping infini
                        if (newX < -(dimensions.cardWidth + dimensions.gap)) {
                            newX += totalWidth;
                        }
                        if (newX > totalWidth - dimensions.cardWidth) {
                            newX -= totalWidth;
                        }
                        return { ...item, x: newX };
                    });
                });
            }

            if (!isAutoCentering.current && !targetItemRef.current) {
                if (isInertiaScroll.current) {
                    targetSpeed.current *= 0.88; // Décélération plus rapide
                    if (Math.abs(targetSpeed.current) < 0.8) { // Seuil d'arrêt plus élevé
                        targetSpeed.current = 0;
                        isInertiaScroll.current = false;
                    }
                }
                speedRef.current += (targetSpeed.current - speedRef.current) * 0.2; // Réactivité augmentée
                if (Math.abs(speedRef.current) < 0.01) speedRef.current = 0;

                if (speedRef.current !== 0) {
                    setItems((prev) =>
                        prev.map((item) => {
                            let newX = item.x - speedRef.current;
                            
                            // Wrapping infini
                            if (newX < -(dimensions.cardWidth + dimensions.gap)) {
                                newX += totalWidth;
                            }
                            if (newX > totalWidth - dimensions.cardWidth) {
                                newX -= totalWidth;
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
            cancelAnimationFrame(animationRef.current);
            if (centerPauseTimeout.current) clearTimeout(centerPauseTimeout.current);
        };
    }, [videos, items.length, dimensions, isMobile, isTablet, videoList.length]);

    const handleMouseMove = (e) => {
        if (!isAutoCentering.current && targetItemRef.current) {
            targetItemRef.current = null;
        }

        if (isAutoCentering.current) return;

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
        targetSpeed.current = 0;
    };

    const touchX = useRef(null);
    const lastTouchX = useRef(null);
    const touchVelocityRef = useRef(0);
    const lastTouchTimeRef = useRef(0);
    const isInertiaScroll = useRef(false);

    const handleTouchStart = (e) => {
        if (!isAutoCentering.current && targetItemRef.current) {
            targetItemRef.current = null;
        }
        if (isAutoCentering.current) return;

        touchX.current = e.touches[0].clientX;
        lastTouchX.current = e.touches[0].clientX;
        lastTouchTimeRef.current = performance.now();
        touchVelocityRef.current = 0;
        isInertiaScroll.current = false;
    };

    const handleTouchMove = (e) => {
        if (isAutoCentering.current) return;

        const now = performance.now();
        const dt = Math.max(now - lastTouchTimeRef.current, 1);
        const delta = e.touches[0].clientX - lastTouchX.current;

        targetSpeed.current = -delta;
        
        const instantVelocity = -delta * (1000 / dt);
        touchVelocityRef.current = instantVelocity * 0.2 + touchVelocityRef.current * 0.8;

        lastTouchX.current = e.touches[0].clientX;
        lastTouchTimeRef.current = now;

        e.preventDefault();
    };

    const handleTouchEnd = () => {
        const momentum = touchVelocityRef.current * 0.05; // Réduit de 0.1 à 0.05
        const sign = Math.sign(momentum);
        const capped = Math.min(Math.abs(momentum), 12) * sign; // Réduit de 20 à 12
        targetSpeed.current = capped;
        speedRef.current = capped;
        isInertiaScroll.current = true;

        touchX.current = null;
        lastTouchX.current = null;
    };

    const handleClick = (item) => {
        if (!containerRef.current || items.length === 0) return;

        if (centerPauseTimeout.current) clearTimeout(centerPauseTimeout.current);

        targetItemRef.current = item;
        isAutoCentering.current = true;

        const originalItem = videoList.find(v => v.id === item.originalId);
        if (originalItem) {
            onSelectVideo(originalItem);
        }
    };

    const lastCenterUpdate = useRef(0);
    useEffect(() => {
        if (!containerRef.current || !items.length || dimensions.cardWidth === 0) return;
        const now = performance.now();
        if (now - lastCenterUpdate.current < 80) return;
        lastCenterUpdate.current = now;

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

    // Rendu avec clonage dynamique côté render
    const containerWidth = containerRef.current?.getBoundingClientRect().width || 0;
    const totalWidth = (dimensions.cardWidth + dimensions.gap) * videoList.length;
    
    // Générer les clones nécessaires pour remplir le viewport + marges
    const renderMargin = dimensions.cardWidth * 5; // Large marge
    const itemsToRender = [];
    
    items.forEach((item) => {
        // Clone à gauche
        if (item.x + dimensions.cardWidth > -renderMargin && item.x < 0) {
            itemsToRender.push({ ...item, x: item.x + totalWidth, cloneKey: 'left' });
        }
        // Original
        if (item.x + dimensions.cardWidth > -renderMargin && item.x < containerWidth + renderMargin) {
            itemsToRender.push({ ...item, cloneKey: 'original' });
        }
        // Clone à droite
        if (item.x < containerWidth + renderMargin && item.x + dimensions.cardWidth > containerWidth) {
            itemsToRender.push({ ...item, x: item.x - totalWidth, cloneKey: 'right' });
        }
    });

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
                    overflow: isMobile ? 'hidden' : 'visible',
                    touchAction: isMobile ? 'pan-y' : 'auto',
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {itemsToRender.map((item, i) => {
                    const itemWidth = dimensions.cardWidth;
                    const itemHeight = dimensions.cardHeight;
                    const itemX = item.x;

                    return (
                        <div
                            key={`${item.originalId}-${item.cloneKey}-${i}`}
                            className="absolute"
                            style={{
                                left: 0,
                                width: `${itemWidth}px`,
                                bottom: "0px",
                                zIndex: 50,
                                willChange: "transform",
                                transform: `translate3d(${itemX}px, 0, 0)`,
                            }}
                        >
                            <img
                                src={item.thumbnail || item.url}
                                alt={item.title || item.alt}
                                onClick={() => handleClick(item)}
                                className="w-full cursor-pointer"
                                loading="eager"
                                decoding="async"
                                style={{
                                    height: `${itemHeight}px`,
                                    objectFit: "cover",
                                }}
                            />
                            <div
                                className="text-center font-HelveticaNeue font-light pt-2 text-grey-darker"
                                style={{
                                    opacity: 1,
                                    marginTop: isMobile ? "11px" : "8px",
                                    fontSize: isMobile ? "12px" : `${TITLE_FONT_SIZE}px`,
                                    borderBottom: selectedVideo && selectedVideo.id === item.originalId ? '0.5px solid currentColor' : 'none',
                                    paddingBottom: selectedVideo && selectedVideo.id === item.originalId ? '1px' : '0',
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
                })}
            </div>
        </div>
    );
}