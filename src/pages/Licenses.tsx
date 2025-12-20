import React, { useEffect, useState } from 'react';

type Status = 'loading' | 'ready' | 'missing' | 'error';

function Licenses() {
  const [licenseText, setLicenseText] = useState('');
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');

  const licenseUrl = `${import.meta.env.BASE_URL ?? '/'}THIRD-PARTY-LICENSE.md`;

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    setLicenseText('');

    fetch(licenseUrl, { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) {
          setStatus('missing');
          return null;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        if (controller.signal.aborted || text === null) return;
        setLicenseText(text);
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.message || 'Failed to load license file.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [licenseUrl]);

  return (
    <div className="card license-card">
      <h2 style={{ marginTop: 0 }}>Third-Party Licenses</h2>
      {status === 'loading' && <p>Loading THIRD-PARTY-LICENSE.md...</p>}
      {status === 'ready' && (
        <pre className="license-text" aria-label="third-party-license">
          {licenseText}
        </pre>
      )}
      {status === 'missing' && (
        <p className="license-message">
          THIRD-PARTY-LICENSE.md not found. Run <code>npm run license:generate</code> to create it.
        </p>
      )}
      {status === 'error' && (
        <p className="license-message">
          Could not load THIRD-PARTY-LICENSE.md{error ? `: ${error}` : '.'}
        </p>
      )}
      <p className="license-note">
        Generated with <code>@myooken/license-output</code>; displaying the markdown as-is.
      </p>
    </div>
  );
}

export default Licenses;
