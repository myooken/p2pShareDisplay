import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Peer from 'peerjs';
import { Share, Copy, Check, Play, Terminal, Eye, MousePointer2, Maximize, Minimize, PictureInPicture } from 'lucide-react';

const peerCache = new Map();

function Room() {
    const { roomId } = useParams();
    const location = useLocation();
    const [isHost, setIsHost] = useState(null);
    const [status, setStatus] = useState('Initializing...');
    const [stream, setStream] = useState(null);
    const [remoteCursor, setRemoteCursor] = useState({ x: 0, y: 0, visible: false, color: '#ef4444' });
    const [copied, setCopied] = useState(false);
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);

    // Auth state
    const [password, setPassword] = useState(location.state?.password || '');
    const [isAuthenticated, setIsAuthenticated] = useState(false); // For Guest: true if auth success
    const [showAuthModal, setShowAuthModal] = useState(false); // For Guest: if password needed
    const [authInput, setAuthInput] = useState('');

    // Cursor Settings (Guest Side)
    const [cursorMode, setCursorMode] = useState('always'); // 'always' | 'click'
    const [cursorColor, setCursorColor] = useState('#ef4444');
    const [isMouseDown, setIsMouseDown] = useState(false);

    // Video Controls State
    const [isPiP, setIsPiP] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);
    const connRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);

    const addLog = (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${msg}`;
        console.log(logEntry);
        setLogs(prev => [...prev.slice(-19), { msg: logEntry, type }]);
    };

    // Effect to handle video stream assignment
    useEffect(() => {
        if (videoRef.current && stream) {
            addLog('Assigning stream to video element via effect');
            videoRef.current.srcObject = stream;
            videoRef.current.play()
                .then(() => addLog('Video playing successfully'))
                .catch(e => addLog(`Error playing video: ${e.message}`, 'error'));
        }
    }, [stream]);

    // Effect for PiP and Fullscreen listeners
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        const handlePiPEnter = () => setIsPiP(true);
        const handlePiPLeave = () => setIsPiP(false);

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        const videoEl = videoRef.current;
        if (videoEl) {
            videoEl.addEventListener('enterpictureinpicture', handlePiPEnter);
            videoEl.addEventListener('leavepictureinpicture', handlePiPLeave);
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (videoEl) {
                videoEl.removeEventListener('enterpictureinpicture', handlePiPEnter);
                videoEl.removeEventListener('leavepictureinpicture', handlePiPLeave);
            }
        };
    }, [stream]);

    useEffect(() => {
        let peer = peerCache.get(roomId);

        if (peer && !peer.destroyed) {
            addLog(`Reusing cached peer for: ${roomId}`);
            if (peer._cleanupTimer) {
                clearTimeout(peer._cleanupTimer);
                peer._cleanupTimer = null;
            }
        } else {
            addLog(`Initializing new Peer with ID: ${roomId}`);
            peer = new Peer(roomId, { debug: 2 });
            peerCache.set(roomId, peer);
        }

        peerRef.current = peer;

        const handleOpen = (id) => {
            addLog(`Peer Opened: ${id}`);
            if (id === roomId) {
                setIsHost(true);
                setStatus('Waiting for guest...');
                if (password) {
                    addLog('Room is password protected');
                }
            } else {
                setIsHost(false);
            }
        };

        const handleConnection = (conn) => {
            addLog(`Received connection from: ${conn.peer}`);
            connRef.current = conn;

            const handleData = (data) => {
                if (data.type === 'auth') {
                    if (data.password === password) {
                        addLog('Password verified. Access granted.');
                        conn.send({ type: 'auth-success' });
                        setStatus('Guest connected');
                        if (streamRef.current) {
                            callGuest(peer, conn.peer, streamRef.current);
                        }
                    } else {
                        addLog('Invalid password attempt.', 'error');
                        conn.send({ type: 'auth-fail' });
                        setTimeout(() => conn.close(), 500);
                    }
                } else if (data.type === 'cursor') {
                    setRemoteCursor({ x: data.x, y: data.y, visible: data.visible, color: data.color || '#ef4444' });
                }
            };

            // If we have a password, we wait for auth
            if (password) {
                setStatus('Guest connecting (verifying password)...');
                conn.on('data', handleData);
            } else {
                // No password, allow immediately
                conn.on('open', () => {
                    setStatus('Guest connected');
                    conn.send({ type: 'auth-success' });
                    if (streamRef.current) {
                        callGuest(peer, conn.peer, streamRef.current);
                    }
                    // Also listen for cursor data here
                    conn.on('data', (data) => {
                        if (data.type === 'cursor') {
                            setRemoteCursor({ x: data.x, y: data.y, visible: data.visible, color: data.color || '#ef4444' });
                        }
                    });
                });
            }
        };

        const handleError = (err) => {
            addLog(`Peer error: ${err.type}`, 'error');
            if (err.type === 'unavailable-id') {
                addLog('ID taken. Checking if we should be Guest...');
                peer.destroy();
                peerCache.delete(roomId);
                initializeGuest();
            } else {
                setStatus('Error: ' + err.type);
            }
        };

        peer.off('open');
        peer.off('connection');
        peer.off('error');
        peer.off('call');

        peer.on('open', handleOpen);
        peer.on('connection', handleConnection);
        peer.on('error', handleError);

        if (peer.open) {
            handleOpen(peer.id);
        }

        return () => {
            addLog('Cleaning up Peer effect');
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                const p = peerRef.current;
                p._cleanupTimer = setTimeout(() => {
                    addLog('Destroying peer after timeout');
                    p.destroy();
                    peerCache.delete(roomId);
                }, 1000);
            }
        };
    }, [roomId, password]); // Re-run if password changes (shouldn't happen but good practice)

    const initializeGuest = () => {
        const guest = new Peer();
        peerRef.current = guest;

        guest.on('open', () => {
            addLog('Opened as Guest');
            setIsHost(false);
            setStatus('Connecting to host...');

            const conn = guest.connect(roomId);
            connRef.current = conn;

            conn.on('open', () => {
                addLog('Connected to Host. Sending handshake...');

                // Send password if we have it
                if (password) {
                    conn.send({ type: 'auth', password: password });
                } else {
                    conn.send({ type: 'auth', password: '' });
                }
            });

            conn.on('data', (data) => {
                if (data.type === 'auth-success') {
                    addLog('Authentication successful');
                    setIsAuthenticated(true);
                    setStatus('Connected to Host');
                    setShowAuthModal(false);
                } else if (data.type === 'auth-fail') {
                    addLog('Authentication failed', 'error');
                    setStatus('Authentication Failed');
                    setIsAuthenticated(false);
                    setShowAuthModal(true); // Show modal to retry
                    conn.close();
                }
            });

            conn.on('close', () => {
                if (!isAuthenticated) {
                    // If closed before auth, maybe wrong password
                } else {
                    setStatus('Connection closed');
                }
                connRef.current = null;
            });

            conn.on('error', (err) => {
                addLog(`Connection error: ${err}`, 'error');
                setStatus('Connection Error');
            });
        });

        guest.on('call', (call) => {
            addLog(`Guest received call from: ${call.peer}`);
            call.answer();
            call.on('stream', (remoteStream) => {
                addLog(`Guest received stream: ${remoteStream.id}`);
                setStream(remoteStream);
            });
            call.on('error', (err) => addLog(`Call error: ${err}`, 'error'));
        });

        guest.on('error', (err) => {
            addLog(`Guest error: ${err}`, 'error');
            setStatus('Error: ' + err.type);
        });
    };

    const handleAuthSubmit = () => {
        setPassword(authInput);
        setShowAuthModal(false);
        // Re-initialize guest with new password
        if (peerRef.current) {
            peerRef.current.destroy();
        }
        setTimeout(initializeGuest, 500);
    };

    const callGuest = (peer, guestId, stream) => {
        addLog(`Calling guest: ${guestId} with stream: ${stream.id}`);
        const call = peer.call(guestId, stream);
        call.on('error', (err) => addLog(`Call error (Host side): ${err}`, 'error'));
    };

    const startShare = async () => {
        try {
            addLog('Requesting display media...');
            const s = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });
            addLog(`Got display media: ${s.id}`);
            setStream(s);
            streamRef.current = s;

            if (connRef.current) {
                addLog('Guest already connected, calling them now...');
                callGuest(peerRef.current, connRef.current.peer, s);
            } else {
                addLog('No guest connected yet. Waiting for connection...');
            }

            s.getVideoTracks()[0].onended = () => {
                addLog('Screen share stopped by user');
                stopShare();
            };
        } catch (err) {
            addLog(`Error sharing screen: ${err}`, 'error');
        }
    };

    const stopShare = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    const sendCursor = (e, visible) => {
        if (isHost) return;
        if (!connRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        connRef.current.send({ type: 'cursor', x, y, visible, color: cursorColor });
    };

    const handleMouseMove = (e) => {
        if (cursorMode === 'always') {
            sendCursor(e, true);
        } else if (cursorMode === 'click' && isMouseDown) {
            sendCursor(e, true);
        }
    };

    const handleMouseDown = (e) => {
        setIsMouseDown(true);
        if (cursorMode === 'click') {
            sendCursor(e, true);
        }
    };

    const handleMouseUp = (e) => {
        setIsMouseDown(false);
        if (cursorMode === 'click') {
            sendCursor(e, false);
        }
    };

    const handleMouseLeave = (e) => {
        if (isHost) return;
        if (connRef.current) {
            connRef.current.send({ type: 'cursor', visible: false });
        }
    };

    const copyUrl = () => {
        let hostname = window.location.hostname;
        if ((hostname === 'localhost' || hostname === '127.0.0.1') && typeof __LOCAL_IP__ !== 'undefined') {
            hostname = __LOCAL_IP__;
        }
        const port = window.location.port ? `:${window.location.port}` : '';
        const url = `${window.location.protocol}//${hostname}${port}${window.location.pathname}#/room/${roomId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const manualPlay = () => {
        if (videoRef.current) {
            videoRef.current.play()
                .then(() => addLog('Manual play successful'))
                .catch(e => addLog(`Manual play failed: ${e.message}`, 'error'));
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (videoContainerRef.current) {
                videoContainerRef.current.requestFullscreen().catch(err => {
                    addLog(`Error enabling full-screen: ${err.message}`, 'error');
                });
            }
        } else {
            document.exitFullscreen();
        }
    };

    const togglePiP = async () => {
        try {
            if (videoRef.current) {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await videoRef.current.requestPictureInPicture();
                }
            }
        } catch (error) {
            addLog(`Error with PiP: ${error}`, 'error');
        }
    };

    return (
        <div className="room">
            <div className="header" style={{ justifyContent: 'center', gap: '1rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>Room ID: <strong>{roomId}</strong></span>
                        <button className="icon-btn" onClick={copyUrl} title="Copy Link">
                            {copied ? <Check size={20} color="green" /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>
                <div className="status-badge" style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    backgroundColor: 'var(--secondary-bg)',
                    fontSize: '0.875rem'
                }}>
                    {status}
                </div>
            </div>

            {showAuthModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ minWidth: '300px' }}>
                        <h3>Password Required</h3>
                        <p>This room is protected.</p>
                        <input
                            type="password"
                            value={authInput}
                            onChange={e => setAuthInput(e.target.value)}
                            placeholder="Enter Password"
                            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                        />
                        <button onClick={handleAuthSubmit} style={{ width: '100%' }}>Join</button>
                    </div>
                </div>
            )}

            {isHost === true && (
                <div className="controls">
                    {!stream ? (
                        <button onClick={startShare} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Share size={20} /> Start Screen Share
                        </button>
                    ) : (
                        <button onClick={stopShare} style={{ backgroundColor: '#ef4444' }}>
                            Stop Sharing
                        </button>
                    )}
                </div>
            )}

            {!isHost && isHost !== null && (
                <div className="guest-controls">
                    <div className="control-group">
                        <label>Cursor Mode:</label>
                        <button
                            className={`mode-btn ${cursorMode === 'always' ? 'active' : ''}`}
                            onClick={() => setCursorMode('always')}
                            title="Always Visible"
                        >
                            <Eye size={20} />
                        </button>
                        <button
                            className={`mode-btn ${cursorMode === 'click' ? 'active' : ''}`}
                            onClick={() => setCursorMode('click')}
                            title="Click Only"
                        >
                            <MousePointer2 size={20} />
                        </button>
                    </div>
                    <div className="control-group">
                        <label>Color:</label>
                        {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'].map(color => (
                            <div
                                key={color}
                                className={`color-swatch ${cursorColor === color ? 'active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setCursorColor(color)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div
                className="video-container"
                ref={videoContainerRef}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {stream ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted={isHost} // Host mutes their own preview
                            style={{ width: '100%', cursor: 'default' }}
                        />
                        <div className="video-controls" style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '1rem',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '1rem',
                            opacity: 0,
                            transition: 'opacity 0.3s',
                        }}>
                            {!isHost && (
                                <button onClick={manualPlay} className="icon-btn" title="Force Play Video" style={{ color: 'white' }}>
                                    <Play size={20} />
                                </button>
                            )}
                            <button onClick={togglePiP} className="icon-btn" title="Picture in Picture" style={{ color: 'white' }}>
                                <PictureInPicture size={20} />
                            </button>
                            <button onClick={toggleFullscreen} className="icon-btn" title="Fullscreen" style={{ color: 'white' }}>
                                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                            </button>
                        </div>
                        {isPiP && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                color: 'white',
                                padding: '1rem 2rem',
                                borderRadius: '8px',
                                textAlign: 'center',
                                pointerEvents: 'none',
                                zIndex: 50
                            }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>Playing in Picture-in-Picture</p>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#fbbf24' }}>
                                    ⚠️ Remote cursor is NOT visible in PiP mode.
                                </p>
                            </div>
                        )}
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
                            boxShadow: `0 0 10px ${remoteCursor.color}`
                        }}
                    />
                )}
            </div>

            <button
                className="icon-btn"
                onClick={() => setShowLogs(!showLogs)}
                title="Toggle Logs"
                style={{
                    position: 'fixed',
                    bottom: '1rem',
                    left: '1rem',
                    zIndex: 1001,
                    backgroundColor: 'var(--card-bg)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
            >
                <Terminal size={20} />
            </button>

            {showLogs && (
                <div className="debug-logs" style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '200px',
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    color: '#0f0',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    overflowY: 'auto',
                    padding: '1rem',
                    zIndex: 1000,
                    borderTop: '1px solid #333'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>Debug Logs</strong>
                        <button onClick={() => setLogs([])} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Clear</button>
                    </div>
                    {logs.map((log, i) => (
                        <div key={i} style={{ color: log.type === 'error' ? '#ff4444' : '#0f0' }}>
                            {log.msg}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Room;
