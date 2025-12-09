import React from 'react';
import { Copy, Check, QrCode } from 'lucide-react';

function RoomHeader({ roomId, status, onCopy, copied, onShowQRCode }) {
  return (
    <div className="header" style={{ justifyContent: 'center', gap: '1rem', flexDirection: 'column', padding: '0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>
            Room ID: <strong>{roomId}</strong>
          </span>
          <button className="icon-btn" onClick={onCopy} title="Copy Link">
            {copied ? <Check size={20} color="green" /> : <Copy size={20} />}
          </button>
          <button className="icon-btn" onClick={onShowQRCode} title="Show QR Code">
            <QrCode size={20} />
          </button>
        </div>
      </div>
      <div
        className="status-badge"
        style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          backgroundColor: 'var(--secondary-bg)',
          fontSize: '0.875rem',
        }}
      >
        {status}
      </div>
    </div>
  );
}

export default RoomHeader;
