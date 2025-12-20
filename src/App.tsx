import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import Home from './pages/Home';
import Room from './pages/Room';
import Licenses from './pages/Licenses';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Ensure hash-based routing URL always contains a hash segment on first load
    if (!window.location.hash || window.location.hash === '#') {
      const { origin, pathname, search } = window.location;
      window.location.replace(`${origin}${pathname}${search}#/`);
    }
  }, []);

  useEffect(() => {
    // Check system preference on load
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Router>
      <div className="app-container">
        <header className="header">
          <Link to="/" className="brand-link">
            <h1 style={{ margin: 0 }}>P2P Screen Share</h1>
          </Link>
          <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle Dark Mode">
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/licenses" element={<Licenses />} />
          </Routes>
        </main>

        <footer className="site-footer">
          <div className="footer-title">P2P Screen Share</div>
          <div className="footer-links">
            <Link to="/licenses">Third-party licenses</Link>
            <span aria-hidden="true">•</span>
            <a href="https://github.com/myooken/p2pShareDisplay" target="_blank" rel="noreferrer">
              GitHub repository
            </a>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
