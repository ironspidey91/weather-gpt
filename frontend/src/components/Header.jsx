import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Volume2, VolumeX, ShieldAlert, Radio, Navigation, Cpu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CITY_LIST } from '../services/weatherService';

export default function Header({ currentCity, onSelectCity, speechEnabled, setSpeechEnabled, activeAlertCount, onLocate, locating, onAlertClick }) {
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
    <header className="glass-panel header-gradient-border sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <span className="text-lg">⛅</span>
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Mausam<span className="text-gradient">AI</span>
            </h1>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Ministry of Earth Sciences
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
          {/* Alert Badge */}
          <div className="relative">
            <button onClick={onAlertClick} className="btn-icon" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.06)' }} id="alerts-btn" aria-label="Weather alerts">
              <ShieldAlert className="w-4 h-4" />
              {activeAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-rose)', color: '#fff' }}>
                  {activeAlertCount}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
