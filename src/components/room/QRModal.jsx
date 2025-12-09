import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

function QRModal({ open, roomUrl, onClose }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{ width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <h3>Scan to Join</h3>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
          <QRCodeSVG value={roomUrl} size={200} />
        </div>
        <p style={{ fontSize: '0.9rem', color: '#888', wordBreak: 'break-all', textAlign: 'center' }}>{roomUrl}</p>
        <button onClick={onClose} style={{ width: '100%' }}>
          Close
        </button>
      </div>
    </div>
  );
}

export default QRModal;
