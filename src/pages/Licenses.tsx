import React from 'react';

type LicenseEntry = {
  id: string;
  file: string;
  content: string;
};

const projectLicenseText =
  Object.values(
    import.meta.glob<string>('../../docs/licenses/PROJECT-LICENSE.txt', {
      query: '?raw',
      import: 'default',
      eager: true,
    })
  )[0] || '';

const thirdPartyList =
  Object.values(
    import.meta.glob<string>('../../docs/licenses/THIRD-PARTY-LICENSES.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    })
  )[0] || '';

const attributionText =
  Object.values(
    import.meta.glob<string>('../../docs/licenses/ATTRIBUTION.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    })
  )[0] || '';

const licenseTexts = Object.entries(
  import.meta.glob<string>('../../docs/licenses/texts/*.txt', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
)
  .map(([path, content]) => {
    const file = path.split('/').pop() || path;
    const id = file.replace(/\.txt$/i, '');
    return { id, file, content } as LicenseEntry;
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const noticeEntries = Object.entries(
  import.meta.glob<string>('../../docs/licenses/notices/*.txt', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
)
  .map(([path, content]) => {
    const file = path.split('/').pop() || path;
    const id = file.replace(/\.txt$/i, '');
    return { id, file, content } as LicenseEntry;
  })
  .sort((a, b) => a.id.localeCompare(b.id));

function Licenses() {
  return (
    <div className="card license-card">
      <h2 style={{ marginTop: 0 }}>Licenses</h2>

      <section className="license-section">
        <h3>Project license</h3>
        {projectLicenseText ? (
          <pre className="license-block">{projectLicenseText}</pre>
        ) : (
          <p>License file not found.</p>
        )}
      </section>

      <section className="license-section">
        <h3>Third-party summary</h3>
        {thirdPartyList ? (
          <pre className="license-block">{thirdPartyList}</pre>
        ) : (
          <p>No third-party summary available.</p>
        )}
      </section>

      <section className="license-section">
        <h3>License texts</h3>
        {licenseTexts.length === 0 ? (
          <p>No license texts found in docs/licenses/texts.</p>
        ) : (
          licenseTexts.map((entry) => (
            <div key={entry.file} className="license-entry">
              <div className="license-entry__title">{entry.id}</div>
              <pre className="license-block">{entry.content}</pre>
            </div>
          ))
        )}
      </section>

      <section className="license-section">
        <h3>Notices</h3>
        {noticeEntries.length === 0 ? (
          <p>No notices required.</p>
        ) : (
          noticeEntries.map((entry) => (
            <div key={entry.file} className="license-entry">
              <div className="license-entry__title">{entry.id}</div>
              <pre className="license-block">{entry.content}</pre>
            </div>
          ))
        )}
      </section>

      {attributionText ? (
        <section className="license-section">
          <h3>Attribution</h3>
          <pre className="license-block">{attributionText}</pre>
        </section>
      ) : null}
    </div>
  );
}

export default Licenses;
