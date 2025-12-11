import React from 'react';
import licensesRaw from '../../THIRD-PARTY-LICENSES.md?raw';

function Licenses() {
  return (
    <div className="card license-card">
      <h2 style={{ marginTop: 0 }}>Third-party licenses</h2>
      <pre className="license-content" aria-label="Third-party license text">
        {licensesRaw}
      </pre>
    </div>
  );
}

export default Licenses;
