import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Volume2, VolumeX, ShieldAlert, Radio, Sun, Moon, Navigation, Cpu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CITY_LIST } from '../services/weatherService';

export default function Header({ currentCity, onSelectCity, speechEnabled, setSpeechEnabled, activeAlertCount, theme, setTheme, onLocate, locating }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredCities = searchQuery.trim()
    ? CITY_LIST.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    : CITY_LIST;

  const handleSelect = (city) => {
    onSelectCity(city);
    setSearchQuery('');
    setDropdownOpen(false);
    inputRef.current?.blur();
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard nav
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="glass-panel sticky top-0 z-50 border-b px-4 py-2.5" style={{ borderColor: 'var(--border-glass)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-lg">⛅</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-extrabold tracking-tight flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
              Weather<span style={{ color: 'var(--accent-cyan)' }}>GPT</span>
              <span className="badge badge-cyan text-[9px] py-0 px-1.5 ml-1 hide-mobile">
                <Cpu className="w-2.5 h-2.5" /> SIH26068
              </span>
            </h1>
            <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              Ministry of Earth Sciences
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-emerald)' }}></span>
              <span style={{ color: 'var(--accent-emerald)', fontSize: '9px', fontWeight: 700 }}>LIVE</span>
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm" ref={dropdownRef}>
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--accent-cyan)' }} />
            <input
              ref={inputRef}
              type="text"
              className="input-glass pl-8 pr-8 text-sm py-2 rounded-xl"
              placeholder="Search city..."
              value={dropdownOpen ? searchQuery : currentCity}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => {
                setDropdownOpen(true);
                setSearchQuery('');
              }}
              onKeyDown={handleKeyDown}
              id="city-search-input"
              aria-label="Search city"
            />
            {dropdownOpen ? (
              <button onClick={() => { setDropdownOpen(false); setSearchQuery(''); }} className="absolute right-3" style={{ color: 'var(--text-muted)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="absolute right-3 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            )}
          </div>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-1.5 glass-card py-1.5 shadow-2xl z-50 max-h-64 overflow-y-auto"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-glass-bright)' }}
              >
                {/* Geolocation button */}
                <button
                  onClick={() => { onLocate(); setDropdownOpen(false); }}
                  disabled={locating}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--accent-cyan)' }}
                  id="use-my-location-btn"
                >
                  <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} style={{ color: 'var(--accent-cyan)' }} />
                  {locating ? 'Detecting location...' : 'Use My Location'}
                </button>
                <div className="h-px mx-3 my-1" style={{ background: 'var(--border-glass)' }}></div>
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Cities & Stations
                </div>
                {filteredCities.length > 0 ? filteredCities.map((city) => (
                  <button
                    key={city}
                    className="w-full text-left px-3 py-1.5 text-sm flex items-center justify-between transition-colors"
                    style={{
                      color: city === currentCity ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      background: city === currentCity ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                      fontWeight: city === currentCity ? 600 : 400
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = city === currentCity ? 'rgba(6, 182, 212, 0.08)' : 'transparent'}
                    onClick={() => handleSelect(city)}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" style={{ opacity: 0.5 }} /> {city}
                    </span>
                    {city === currentCity && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-cyan)' }}></span>}
                  </button>
                )) : (
                  <div className="px-3 py-3 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No cities found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Voice Toggle */}
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className="btn-icon"
            style={speechEnabled ? { borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)' } : {}}
            title={speechEnabled ? "Voice Output Active" : "Enable Voice Output"}
            id="voice-toggle-btn"
            aria-label="Toggle voice output"
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-icon"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            id="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </button>

          {/* Alert Badge */}
          <div className="relative">
            <button className="btn-icon" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.06)' }} id="alerts-btn" aria-label="Weather alerts">
              <ShieldAlert className="w-4 h-4" />
              {activeAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce"
                  style={{ backgroundColor: 'var(--accent-rose)', color: '#fff' }}>
                  {activeAlertCount}
                </span>
              )}
            </button>
          </div>

          {/* INSAT badge (desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold"
            style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', color: 'var(--accent-indigo)' }}>
            <Radio className="w-3 h-3 animate-pulse" /> INSAT-3DR
          </div>
        </div>

      </div>
    </header>
  );
}
