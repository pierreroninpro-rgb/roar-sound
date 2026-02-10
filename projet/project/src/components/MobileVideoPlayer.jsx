/**
 * Lecteur vidéo mobile avec react-player (Vimeo).
 * Design identique à la navbar actuelle : play/pause, barre de progression, son, plein écran.
 * @see https://github.com/CookPete/react-player
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
  const [volume, setVolume] = useState(1);

  const handlePlayPause = useCallback(() => {
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
    setIsMuted((m) => !m);
    setVolume((v) => (v > 0 ? 0 : 1));
  }, []);

  const seekTo = useCallback((clientX) => {
    if (!progressBarRef.current || !playerRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    playerRef.current.seekTo(pct, "fraction");
    setProgress(pct * (duration || 1));
  }, [duration]);

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  if (!selectedVideo?.url) return null;

  return (
    <div
      className="overflow-hidden relative w-full"
      style={{
        height: `${videoHeightPercent * 100}vh`,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        backgroundColor: "transparent",
      }}
    >
      <ReactPlayer
        ref={playerRef}
        url={selectedVideo.url}
        playing={playing}
        volume={volume}
        muted={isMuted}
        loop
        controls={false}
        width="100%"
        height="100%"
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

      {/* Overlay clic → play/pause (comme ton design) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      />

      {/* Navbar : même design que VideoList (play, barre, son, plein écran) */}
      <div
        data-navbar
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
          transition: "opacity 0.3s ease-in-out",
          zIndex: 20,
          pointerEvents: "auto",
          fontFamily: "'Helvetica', 'Arial', sans-serif",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onClick={handlePlayPause}
          onTouchStart={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={playing ? "/images/pause.png" : "/images/play.png"}
            alt={playing ? "Pause" : "Play"}
            style={{ width: "20px", height: "20px" }}
          />
        </div>

        <div
          ref={progressBarRef}
          className="relative flex-1 flex items-center min-h-[32px] cursor-pointer rounded-full overflow-visible"
          onClick={(e) => {
            e.stopPropagation();
            seekTo(e.clientX);
          }}
          onTouchEnd={(e) => {
            if (!e.changedTouches?.length) return;
            e.preventDefault();
            e.stopPropagation();
            seekTo(e.changedTouches[0].clientX);
          }}
        >
          <div className="relative w-full h-1 bg-gray-600 rounded-full overflow-visible">
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full"
              style={{
                width: `${progressPct}%`,
                transition: "all 0.1s ease-out",
              }}
            />
          </div>
        </div>

        <div
          onClick={handleToggleMute}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={isMuted ? "/images/soundoff.png" : "/images/soundon.png"}
            alt={isMuted ? "Unmute" : "Mute"}
            style={{ width: "36px", height: "36px" }}
          />
        </div>

        {onFullscreen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen();
            }}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center flex-shrink-0"
            style={{ padding: "0.25rem" }}
          >
            <img
              src="/images/open.png"
              alt="Plein écran"
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
