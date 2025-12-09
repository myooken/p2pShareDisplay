import React from 'react';

function AuthModal({ open, authInput, onChange, onSubmit }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
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
      <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
        <h3>Password Required</h3>
        <p>This room is protected.</p>
        <input
          type="password"
          value={authInput}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter Password"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <button onClick={onSubmit} style={{ width: '100%' }}>
          Join
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
