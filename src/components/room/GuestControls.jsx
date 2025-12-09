import React from 'react';
import { Eye, MousePointer2 } from 'lucide-react';

const cursorColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];

function GuestControls({ cursorMode, setCursorMode, cursorColor, setCursorColor }) {
  return (
    <div className="guest-controls" style={{ flexWrap: 'wrap' }}>
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
        {cursorColors.map(color => (
          <div
            key={color}
            className={`color-swatch ${cursorColor === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setCursorColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

export default GuestControls;
