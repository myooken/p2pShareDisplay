import React from 'react';
import { Play, PictureInPicture, Maximize, Minimize } from 'lucide-react';

function VideoControls({ isHost, isFullscreen, toggleFullscreen, togglePiP, manualPlay, scaleMode, toggleScaleMode }) {
  return (
    <div
      className="video-controls video-controls-overlay"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '1rem',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        opacity: 1, // Always visible on mobile for easier access, or handle via JS
        transition: 'opacity 0.3s',
      }}
    >
      {!isHost && (
        <button onClick={manualPlay} className="icon-btn" title="Force Play Video" style={{ color: 'white' }}>
          <Play size={20} />
        </button>
      )}
      <button onClick={togglePiP} className="icon-btn" title="Picture in Picture" style={{ color: 'white' }}>
        <PictureInPicture size={20} />
      </button>
      <button onClick={toggleScaleMode} className="icon-btn" title="Toggle Fit/Fill" style={{ color: 'white' }}>
        {scaleMode === 'contain' ? <Maximize size={20} /> : <Minimize size={20} />}
      </button>
      <button onClick={toggleFullscreen} className="icon-btn" title="Fullscreen" style={{ color: 'white' }}>
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
    </div>
  );
}

export default VideoControls;
