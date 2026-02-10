/**
 * Lecteur vidéo mobile avec react-player (Vimeo).
 * Design identique à la navbar actuelle : play/pause, barre de progression, son, plein écran.
 */
import { useRef, useState, useCallback } from "react";
import ReactPlayer from "react-player";

export default function MobileVideoPlayer({
  selectedVideo,
  horizontalMargin = 15,
  videoHeightPercent = 0.28,
  onFullscreen,
}) {
  const playerRef = useRef(null);
  const progressBarRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlayPause = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setPlaying((p) => !p);
  }, []);

  const handleProgress = useCallback((state) => {
    setProgress(state.playedSeconds);
  }, []);

  const handleDuration = useCallback((d) => {
    setDuration(d);
  }, []);

  const handleToggleMute = useCallback((e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsMuted((m) => !m);
  }, []);

  const handleFullscreenClick = useCallback(
    (e) => {
      e?.stopPropagation();
      e?.preventDefault();
      if (onFullscreen) onFullscreen();
    },
    [onFullscreen]
  );

  const seekTo = useCallback((clientX) => {
    if (!progressBarRef.current || !playerRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    playerRef.current.seekTo(pct, "fraction");
    setProgress(pct * (duration || 1));
  }, [duration]);

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  if (!selectedVideo?.url) return null;

  const containerHeight = `${videoHeightPercent * 100}vh`;
  const minHeight = 180;

  return (
    <div
      className="overflow-hidden relative w-full"
      style={{
        height: containerHeight,
        minHeight,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        backgroundColor: "#000",
      }}
    >
      {/* Zone du lecteur : visible, avec prévisualisation Vimeo (light) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          minHeight,
          background: "#000",
        }}
      >
        <ReactPlayer
          ref={playerRef}
          url={selectedVideo.url}
          playing={playing}
          volume={isMuted ? 0 : 1}
          muted={isMuted}
          loop
          controls={false}
          width="100%"
          height="100%"
          light={true}
          playsinline
          style={{ position: "absolute", top: 0, left: 0 }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onProgress={handleProgress}
          onDuration={handleDuration}
          config={{
            vimeo: {
              playerOptions: {
                responsive: true,
                title: selectedVideo.title,
              },
            },
          }}
        />
      </div>

      <div
        data-navbar
        role="toolbar"
        style={{
          padding: "0.1rem 1rem",
          paddingBottom: "calc(0.1rem + 4px)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          position: "absolute",
          bottom: "4px",
          left: `${horizontalMargin}px`,
          right: `${horizontalMargin}px`,
          zIndex: 20,
          pointerEvents: "auto",
          fontFamily: "'Helvetica', 'Arial', sans-serif",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handlePlayPause}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePlayPause(e);
          }}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            margin: 0,
            border: "none",
            background: "transparent",
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          <img
            src={playing ? "/images/pause.png" : "/images/play.png"}
            alt=""
            style={{ width: "20px", height: "20px", display: "block" }}
          />
        </button>

        <div
          ref={progressBarRef}
          className="relative flex-1 flex items-center min-h-[32px] cursor-pointer rounded-full overflow-visible"
          style={{ minWidth: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            seekTo(e.clientX);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchEnd={(e) => {
            if (!e.changedTouches?.length) return;
            e.stopPropagation();
            e.preventDefault();
            seekTo(e.changedTouches[0].clientX);
          }}
          role="slider"
          aria-label="Progression"
        >
          <div className="relative w-full h-1 bg-gray-600 rounded-full overflow-visible">
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full"
              style={{
                width: `${progressPct}%`,
                transition: "width 0.1s ease-out",
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleMute}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleMute(e);
          }}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            margin: 0,
            border: "none",
            background: "transparent",
          }}
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          <img
            src={isMuted ? "/images/soundoff.png" : "/images/soundon.png"}
            alt=""
            style={{ width: "36px", height: "36px", display: "block" }}
          />
        </button>

        {onFullscreen && (
          <button
            type="button"
            onClick={handleFullscreenClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFullscreenClick(e);
            }}
            style={{
              padding: "0.25rem",
              cursor: "pointer",
              border: "none",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Plein écran"
          >
            <img
              src="/images/open.png"
              alt=""
              style={{
                display: "block",
                width: "20px",
                height: "20px",
                marginBottom: "3px",
              }}
            />
          </button>
        )}
      </div>
    </div>
  );
}
