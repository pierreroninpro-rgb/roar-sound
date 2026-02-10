/**
 * Lecteur vidéo mobile basé sur ReactAllPlayer (Vimeo).
 * Utilisé uniquement en version mobile pour bénéficier de la gestion play/son.
 * Le design (navbar) est conservé via des composants personnalisés.
 */
import { useRef, useCallback, useState } from "react";
import ReactAllPlayer, { useVideo } from "react-all-player";

function getVimeoId(url) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/video\/(\d+)/) || url.match(/player\.vimeo\.com\/video\/(\d+)/);
  return m ? m[1] : null;
}

// Barre de contrôle qui reprend le design actuel (icônes play, barre de progression, son, plein écran)
function CustomMobileControls({ onFullscreen, horizontalMargin = 15 }) {
  const { videoEl, videoState } = useVideo();
  const [dragging, setDragging] = useState(false);
  const progressBarRef = useRef(null);

  const togglePlay = useCallback(() => {
    if (!videoEl) return;
    if (videoState.paused) {
      videoEl.play?.();
    } else {
      videoEl.pause?.();
    }
  }, [videoEl, videoState.paused]);

  const toggleMute = useCallback(() => {
    if (!videoEl) return;
    if (videoEl.volume !== undefined) {
      videoEl.volume = videoEl.volume > 0 ? 0 : 1;
    }
  }, [videoEl]);

  const seek = useCallback(
    (clientX) => {
      if (!progressBarRef.current || !videoEl || !videoState.duration) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (videoEl.currentTime !== undefined) {
        videoEl.currentTime = pct * videoState.duration;
      }
    },
    [videoEl, videoState.duration]
  );

  const progress = videoState.duration > 0 ? (videoState.currentTime / videoState.duration) * 100 : 0;
  const isMuted = videoState.volume === 0;

  return (
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
        onClick={togglePlay}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={videoState.paused ? "/images/play.png" : "/images/pause.png"}
          alt={videoState.paused ? "Play" : "Pause"}
          style={{ width: "20px", height: "20px" }}
        />
      </div>

      <div
        ref={progressBarRef}
        className="relative flex-1 flex items-center min-h-[32px] cursor-pointer rounded-full overflow-visible"
        onClick={(e) => seek(e.clientX)}
        onTouchEnd={(e) => {
          if (e.changedTouches?.[0]) seek(e.changedTouches[0].clientX);
        }}
      >
        <div className="relative w-full h-1 bg-gray-600 rounded-full overflow-visible">
          <div
            className="absolute top-0 left-0 h-full bg-white rounded-full"
            style={{
              width: `${progress}%`,
              transition: dragging ? "none" : "all 0.1s ease-out",
            }}
          />
        </div>
      </div>

      <div
        onClick={toggleMute}
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
            style={{ display: "block", width: "20px", height: "20px", marginBottom: "3px" }}
          />
        </button>
      )}
    </div>
  );
}

export default function MobileVideoPlayer({
  selectedVideo,
  horizontalMargin = 15,
  videoHeightPercent = 0.28,
  onFullscreen,
}) {
  const vimeoId = getVimeoId(selectedVideo?.url);
  if (!selectedVideo?.url || !vimeoId) return null;

  const sources = [{ file: vimeoId, type: "vimeo" }];

  const CustomControls = useCallback(
    () => (
      <CustomMobileControls
        onFullscreen={onFullscreen}
        horizontalMargin={horizontalMargin}
      />
    ),
    [onFullscreen, horizontalMargin]
  );

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
      <ReactAllPlayer
        sources={sources}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
        components={{ MobileControls: CustomControls }}
      />
    </div>
  );
}
