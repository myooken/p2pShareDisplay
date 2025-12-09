import React, { useState } from 'react';
import useVideoControls from '../../hooks/useVideoControls';
import VideoControls from './VideoControls';
import PiPBanner from './PiPBanner';

function VideoPlayer({
  stream,
  isHost,
  remoteCursor,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onLog,
}) {
  const { videoRef, containerRef, isPiP, isFullscreen, toggleFullscreen, togglePiP, manualPlay } = useVideoControls(
    stream,
    onLog
  );
  const [scaleMode, setScaleMode] = useState('contain'); // 'contain' or 'cover'

  const toggleScaleMode = () => {
    setScaleMode(prev => (prev === 'contain' ? 'cover' : 'contain'));
  };

  return (
    <div
      className="video-container"
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isHost}
            style={{
              width: '100%',
              height: '100%',
              objectFit: scaleMode,
              cursor: 'default',
            }}
          />
          <VideoControls
            isHost={isHost}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            togglePiP={togglePiP}
            manualPlay={manualPlay}
            scaleMode={scaleMode}
            toggleScaleMode={toggleScaleMode}
          />
          {isPiP && <PiPBanner />}
        </>
      ) : (
        <div style={{ padding: '4rem', color: '#666' }}>
          {isHost ? 'Click Start to share your screen' : 'Waiting for host to share screen...'}
        </div>
      )}

      {isHost && remoteCursor.visible && (
        <div
          className="remote-cursor"
          style={{
            left: `${remoteCursor.x * 100}%`,
            top: `${remoteCursor.y * 100}%`,
            backgroundColor: remoteCursor.color,
            boxShadow: `0 0 10px ${remoteCursor.color}`,
          }}
        />
      )}
    </div>
  );
}

export default VideoPlayer;
