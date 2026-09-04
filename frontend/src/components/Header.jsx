import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Volume2, VolumeX, ShieldAlert, Radio, Navigation, Cpu, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CITY_LIST, searchCities, registerDynamicCity } from '../services/weatherService';

export default function Header({ currentCity, onSelectCity, speechEnabled, setSpeechEnabled, activeAlertCount, onLocate, locating, onAlertClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // When the user is typing, show filtered popular cities immediately
  // and also fire a debounced API search for remote results
  const localMatches = searchQuery.trim()
    ? CITY_LIST.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    : CITY_LIST;

  // Debounced geocoding search
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setDropdownOpen(true);

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setApiResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(value);
        setApiResults(results);
      } catch {
        setApiResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce
  }, []);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleSelect = (city) => {
    onSelectCity(city);
    setSearchQuery('');
    setApiResults([]);
    setDropdownOpen(false);
    inputRef.current?.blur();
  };

  const handleSelectApiResult = (result) => {
    // Register the dynamic city so weather fetching works
    registerDynamicCity(result.name, result.lat, result.lon, result.state, result.country);
    onSelectCity(result.name);
    setSearchQuery('');
    setApiResults([]);
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

  // Filter out API results that are already in the local popular list
  const filteredApiResults = apiResults.filter(
    r => !CITY_LIST.some(c => c.toLowerCase() === r.name.toLowerCase())
  );

  const hasQuery = searchQuery.trim().length > 0;

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
              placeholder="Search any city, town, or village..."
              value={dropdownOpen ? searchQuery : currentCity}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                setDropdownOpen(true);
                setSearchQuery('');
              }}
              onKeyDown={handleKeyDown}
              id="city-search-input"
              aria-label="Search city"
            />
            {dropdownOpen ? (
              <button onClick={() => { setDropdownOpen(false); setSearchQuery(''); setApiResults([]); }} className="absolute right-3" style={{ color: 'var(--text-muted)' }}>
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
                className="absolute left-0 right-0 top-full mt-1.5 glass-card py-1.5 shadow-2xl z-50 max-h-72 overflow-y-auto"
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

                {/* Popular cities section (shown when no search query or as local matches) */}
                {localMatches.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {hasQuery ? 'Quick Matches' : 'Popular Cities'}
                    </div>
                    {localMatches.map((city) => (
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
                    ))}
                  </>
                )}

                {/* Searching indicator */}
                {searching && (
                  <div className="px-3 py-2.5 text-sm text-center flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching across India...
                  </div>
                )}

                {/* API geocoded results */}
                {filteredApiResults.length > 0 && (
                  <>
                    <div className="h-px mx-3 my-1" style={{ background: 'var(--border-glass)' }}></div>
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      All Locations
                    </div>
                    {filteredApiResults.map((result, i) => (
                      <button
                        key={`${result.name}-${result.lat}-${result.lon}-${i}`}
                        className="w-full text-left px-3 py-1.5 text-sm flex items-center justify-between transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => handleSelectApiResult(result)}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" style={{ opacity: 0.5 }} />
                          <span>
                            <span style={{ fontWeight: 500 }}>{result.name}</span>
                            {result.state && (
                              <span className="text-[11px] ml-1" style={{ color: 'var(--text-muted)' }}>
                                {result.state}{result.countryCode !== 'IN' ? `, ${result.country}` : ''}
                              </span>
                            )}
                          </span>
                        </span>
                        {result.countryCode === 'IN' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                            IN
                          </span>
                        )}
                      </button>
                    ))}
                  </>
                )}

                {/* No results message */}
                {hasQuery && !searching && localMatches.length === 0 && filteredApiResults.length === 0 && (
                  <div className="px-3 py-3 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No locations found</div>
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
