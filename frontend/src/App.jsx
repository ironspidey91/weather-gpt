import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, BarChart3, Map, AlertTriangle } from 'lucide-react';
import Header from './components/Header';
import BackgroundEffects from './components/BackgroundEffects';
import ChatInterface from './components/ChatInterface';
import WeatherDashboard from './components/WeatherDashboard';
import ForecastCharts from './components/ForecastCharts';
import WeatherMap from './components/WeatherMap';
import AlertsBanner from './components/AlertsBanner';
import ClimateInsights from './components/ClimateInsights';
import { fetchWeatherData, getUserLocation, reverseGeocode } from './services/weatherService';

export default function App() {
  const [currentCity, setCurrentCity] = useState('New Delhi');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('wgpt-theme') || 'dark');
  const [locating, setLocating] = useState(false);
  const [mobileTab, setMobileTab] = useState('chat');
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wgpt-theme', theme);
  }, [theme]);

  // Load weather data
  const loadCityData = useCallback(async (city) => {
    setLoading(true);
    try {
      const data = await fetchWeatherData(city);
      setWeatherData(data);
    } catch (err) {
      console.error("Failed to load weather data:", err);
      toast.error('Failed to load weather data. Using fallback.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCityData(currentCity);
  }, [currentCity, loadCityData]);

  // Geolocation handler
  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      const pos = await getUserLocation();
      const cityName = await reverseGeocode(pos.lat, pos.lon);
      setCurrentCity(cityName);
      toast.success(`Location detected: ${cityName}`);
    } catch (err) {
      toast.error('Could not detect location. Please select manually.');
    } finally {
      setLocating(false);
    }
  }, []);

  // Skeleton loader
  const SkeletonBlock = ({ h = '200px', className = '' }) => (
    <div className={`skeleton ${className}`} style={{ height: h, width: '100%', borderRadius: 'var(--radius-xl)' }}></div>
  );

  const MOBILE_TABS = [
    { id: 'chat',      label: 'Chat',      icon: MessageSquare },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'map',       label: 'Map',       icon: Map },
  ];

  return (
    <div className="app-wrapper">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast-custom',
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
          },
        }}
      />

      {/* Animated Background */}
      {weatherData && <BackgroundEffects conditionCategory={weatherData.conditionCategory} />}

      {/* Header */}
      <Header
        currentCity={currentCity}
        onSelectCity={setCurrentCity}
        speechEnabled={speechEnabled}
        setSpeechEnabled={setSpeechEnabled}
        activeAlertCount={weatherData ? (weatherData.daily[0]?.pop > 60 || weatherData.aqi?.value > 150 ? 2 : 1) : 0}
        theme={theme}
        setTheme={setTheme}
        onLocate={handleLocate}
        locating={locating}
        onAlertClick={() => setAlertModalOpen(true)}
      />

      {/* Main Content */}
      {loading || !weatherData ? (
        /* Loading skeleton */
        <div className="skeleton-container animate-fade-in">
          <SkeletonBlock h="60px" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <SkeletonBlock h="620px" />
            </div>
            <div className="lg:col-span-7 space-y-4">
              <SkeletonBlock h="200px" />
              <SkeletonBlock h="100px" />
              <SkeletonBlock h="250px" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Tab Navigation */}
          <div className="show-mobile-only" style={{ padding: '0.5rem 1rem 0' }}>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
              {MOBILE_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMobileTab(tab.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={mobileTab === tab.id
                      ? { background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }
                      : { color: 'var(--text-muted)' }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ Desktop: Two-pane layout ═══ */}
          <div className="desktop-layout hide-mobile">
            {/* Left pane: Chat (fixed to viewport) */}
            <aside className="chat-pane">
              <ChatInterface weatherData={weatherData} speechEnabled={speechEnabled} />
            </aside>

            {/* Right pane: Scrollable dashboard */}
            <main className="dashboard-pane">
              <AlertsBanner weatherData={weatherData} externalOpen={alertModalOpen} onExternalClose={() => setAlertModalOpen(false)} />
              <WeatherDashboard weatherData={weatherData} />
              <ForecastCharts weatherData={weatherData} />
              <WeatherMap weatherData={weatherData} theme={theme} />
              <ClimateInsights weatherData={weatherData} />

              {/* Footer inline */}
              <footer className="inline-footer">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>WeatherGPT</span>
                    <span>&bull; Smart India Hackathon (SIH26068)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>Ministry of Earth Sciences (MoES)</span>
                    <span>&bull; Open-Meteo API</span>
                    <span>&bull; INSAT-3DR Synced</span>
                  </div>
                </div>
              </footer>
            </main>
          </div>

          {/* ═══ Mobile: Tab Content ═══ */}
          <div className="show-mobile-only" style={{ padding: '0.75rem 1rem 1rem' }}>
            <AnimatePresence mode="wait">
              {mobileTab === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  <ChatInterface weatherData={weatherData} speechEnabled={speechEnabled} />
                </motion.div>
              )}
              {mobileTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <AlertsBanner weatherData={weatherData} externalOpen={alertModalOpen} onExternalClose={() => setAlertModalOpen(false)} />
                  <WeatherDashboard weatherData={weatherData} />
                  <ForecastCharts weatherData={weatherData} />
                  <ClimateInsights weatherData={weatherData} />
                </motion.div>
              )}
              {mobileTab === 'map' && (
                <motion.div key="map" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  <WeatherMap weatherData={weatherData} theme={theme} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
