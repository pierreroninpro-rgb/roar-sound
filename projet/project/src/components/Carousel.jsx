import { useRef, useState, useEffect } from 'react';

export default function Carousel({ videos, onSelectVideo, selectedVideo, carouselBottomMargin }) {
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Trouver l'index de la vidéo sélectionnée
  useEffect(() => {
    if (selectedVideo) {
      const index = videos.findIndex(v => v.id === selectedVideo.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [selectedVideo, videos]);

  const handleVideoClick = (video) => {
    onSelectVideo(video);
  };

  const scrollToIndex = (index) => {
    if (carouselRef.current) {
      const item = carouselRef.current.children[index];
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  useEffect(() => {
    scrollToIndex(currentIndex);
  }, [currentIndex]);

  if (!videos || videos.length === 0) {
    return <div className="text-center text-gray-500">Aucune vidéo disponible</div>;
  }

  return (
    <div className="relative w-full">
      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {videos.map((video, index) => {
          const isSelected = selectedVideo?.id === video.id;
          
          return (
            <div
              key={video.id}
              onClick={() => handleVideoClick(video)}
              className={`
                flex-shrink-0 cursor-pointer transition-all duration-300 snap-center
                ${isSelected ? 'scale-105 opacity-100' : 'scale-100 opacity-70 hover:opacity-90'}
              `}
              style={{
                width: index === currentIndex ? '210px' : '154px',
                height: index === currentIndex ? '210px' : '154px',
                minWidth: index === currentIndex ? '210px' : '154px',
              }}
            >
              <img
                src={video.thumbnail || '/images/default.png'}
                alt={video.title}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.target.src = '/images/default.png';
                }}
              />
              {isSelected && (
                <div className="absolute top-2 left-2 font-HelveticaNeue text-white text-xs font-medium" style={{ fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif" }}>
                  {video.title}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
