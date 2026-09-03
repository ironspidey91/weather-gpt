import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Layers, Maximize2, Minimize2, CloudRain, Gauge, Satellite, Thermometer, Wind, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode } from '../services/weatherService';

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Map layer configurations (all 100% free, no API key needed) ──
const OWM_KEY = import.meta.env?.VITE_OPENWEATHER_API_KEY || '';

const LIGHT_BASE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
};

const MAP_LAYERS = {
  standard: {
    label: 'Standard',
    icon: Layers,
    base: LIGHT_BASE,
    overlay: null,
  },
  radar: {
    label: 'Rain Radar',
    icon: CloudRain,
    base: LIGHT_BASE,
    overlay: 'rainviewer',
  },
  temp: {
    label: 'Temperature',
    icon: Thermometer,
    base: LIGHT_BASE,
    overlay: {
      url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
      attribution: '&copy; OpenWeatherMap',
      opacity: 0.85,
    },
    legend: { title: 'Temperature (°C)', stops: ['#821692', '#3949ab', '#00bcd4', '#4caf50', '#ffeb3b', '#ff9800', '#f44336'], labels: ['-40', '-20', '0', '10', '20', '30', '40+'] },
  },
  wind: {
    label: 'Wind',
    icon: Wind,
    base: LIGHT_BASE,
    overlay: {
      url: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
      attribution: '&copy; OpenWeatherMap',
      opacity: 0.85,
    },
    legend: { title: 'Wind Speed (m/s)', stops: ['#ffffff', '#a1e3ff', '#3ab0ff', '#0064c8', '#6b2fbd', '#c81ee0'], labels: ['0', '5', '10', '20', '35', '50+'] },
  },
  pressure: {
    label: 'Pressure',
    icon: Gauge,
    base: LIGHT_BASE,
    overlay: {
      url: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
      attribution: '&copy; OpenWeatherMap',
      opacity: 0.85,
    },
    legend: { title: 'Pressure (hPa)', stops: ['#0000ff', '#00c8ff', '#00ff96', '#ffff00', '#ff9600', '#ff0000'], labels: ['950', '990', '1010', '1020', '1040', '1070'] },
  },
  satellite: {
    label: 'Satellite',
    icon: Satellite,
    base: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri — Source: Esri, USDA, USGS, GeoEye, and the GIS User Community',
    },
    overlay: null,
  },
};

// Recenter map when city changes
function MapUpdater({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.8 });
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);
  }, [center, zoom, map]);

  return null;
}

// Captures clicks on the map when picker mode is active and resolves
// the nearest supported city via reverse geocoding.
function LocationPicker({ active, onPick }) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function WeatherMap({ weatherData, onLocationSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('standard');
  const [isVisible, setIsVisible] = useState(true);
  const [radarUrl, setRadarUrl] = useState('');
  const [pickerActive, setPickerActive] = useState(false);
  const [resolving, setResolving] = useState(false);
  const containerRef = useRef(null);

  const { city, coords, temperature, condition, humidity, windSpeed, windCompass } = weatherData;
  const center = [coords.lat, coords.lon];
  const layer = MAP_LAYERS[activeLayer] || MAP_LAYERS.standard;
  const baseLayer = layer.base;

  // Fetch latest RainViewer radar timestamp (free, no API key)
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(r => r.json())
      .then(data => {
        const latest = data.radar?.past?.slice(-1)[0];
        const host = data.host || 'https://tilecache.rainviewer.com';
        if (latest?.path) {
          setRadarUrl(`${host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`);
        } else {
          console.warn('[WeatherMap] RainViewer returned no radar frames.');
        }
      })
      .catch(() => {
        console.warn('[WeatherMap] Could not reach RainViewer API — radar layer will be unavailable.');
      });
  }, []);

  // Lazy mount: only render the MapContainer when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMapReady = useCallback((e) => {
    const map = e.target;
    setTimeout(() => map.invalidateSize(), 50);
    setTimeout(() => map.invalidateSize(), 300);
    setTimeout(() => map.invalidateSize(), 800);
  }, []);

  const handlePickLocation = useCallback(async (lat, lon) => {
    if (!onLocationSelect) return;
    setResolving(true);
    try {
      const city = await reverseGeocode(lat, lon);
      onLocationSelect(city);
      toast.success(`Showing weather for ${city} (nearest supported city)`);
    } catch {
      toast.error('Could not resolve that location. Try another spot.');
    } finally {
      setResolving(false);
      setPickerActive(false);
    }
  }, [onLocationSelect]);

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 z-[9990] bg-black/80 backdrop-blur-sm" onClick={() => setIsExpanded(false)}></div>
      )}
      <motion.div
        ref={containerRef}
        initial={!isExpanded ? { opacity: 0, y: 12 } : false}
        animate={!isExpanded ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.4 }}
        className={`glass-card relative ${isExpanded ? 'fixed inset-4 z-[9999]' : ''}`}
        style={{ 
          border: '1px solid var(--border-glass)', 
          flexShrink: 0, 
          minHeight: isExpanded ? undefined : '380px', 
          overflow: 'hidden',
          transform: isExpanded ? 'none' : undefined 
        }}
      >
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-glass)' }}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Live Weather Map</h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Layer switcher pills */}
          {Object.entries(MAP_LAYERS).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isActive = activeLayer === key;
            return (
              <motion.button
                key={key}
                onClick={() => setActiveLayer(key)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold relative"
                style={isActive
                  ? { background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid transparent' }
                }
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={cfg.label}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </motion.button>
            );
          })}

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-glass)' }}></div>

          {/* Coordinates */}
          <div className="text-[10px] font-mono px-2 py-0.5 rounded hidden md:block" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
            {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
          </div>

          {/* Location Picker Toggle */}
          {onLocationSelect && (
            <button
              onClick={() => setPickerActive(!pickerActive)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={pickerActive
                ? { background: 'var(--accent-blue)', color: '#fff' }
                : { background: 'rgba(37, 99, 235, 0.08)', color: 'var(--accent-blue)', border: '1px solid rgba(37, 99, 235, 0.2)' }
              }
              title="Click anywhere on the map to check weather there"
              id="location-picker-btn"
            >
              <MapPin className="w-3 h-3" />
              <span className="hidden sm:inline">{pickerActive ? 'Click map...' : 'Pick location'}</span>
            </button>
          )}

          {/* Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-icon w-7 h-7"
            title={isExpanded ? "Minimize" : "Fullscreen"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Picker mode hint */}
      {pickerActive && (
        <div className="px-4 py-1.5 text-[11px] font-medium flex items-center gap-1.5" style={{ background: 'rgba(37, 99, 235, 0.06)', color: 'var(--accent-blue)', borderBottom: '1px solid rgba(37, 99, 235, 0.15)' }}>
          <MapPin className="w-3 h-3" /> {resolving ? 'Finding nearest supported city…' : 'Click anywhere on the map to check that area\'s weather'}
        </div>
      )}

      {/* Map container */}
      <div style={{ height: isExpanded ? 'calc(100% - 44px)' : '332px', width: '100%', cursor: pickerActive ? 'crosshair' : undefined, position: 'relative', borderRadius: isExpanded ? '0' : '0 0 var(--radius-xl) var(--radius-xl)', overflow: 'hidden' }}>
        {/* Gradient legend for data overlay layers */}
        {layer.legend && (
          <div className="absolute z-[1000] rounded-lg px-2.5 py-2" style={{ bottom: '10px', right: '10px', background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)', minWidth: '150px' }}>
            <p className="text-[9px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{layer.legend.title}</p>
            <div style={{ height: '8px', borderRadius: '4px', background: `linear-gradient(90deg, ${layer.legend.stops.join(', ')})` }}></div>
            <div className="flex justify-between mt-0.5">
              {layer.legend.labels.map((l, i) => (
                <span key={i} className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{l}</span>
              ))}
            </div>
            {activeLayer === 'wind' && (
              <p className="text-[8px] mt-1" style={{ color: 'var(--text-muted)' }}>Zoom in — wind is shown as sparse arrows</p>
            )}
          </div>
        )}

        {isVisible ? (
          <MapContainer
            center={center}
            zoom={10}
            scrollWheelZoom={true}
            zoomControl={true}
            style={{ height: '100%', width: '100%' }}
            className="z-10"
            whenReady={handleMapReady}
          >
            <MapUpdater center={center} zoom={10} />
            <LocationPicker active={pickerActive} onPick={handlePickLocation} />
            {/* Base layer */}
            <TileLayer key={baseLayer.url} url={baseLayer.url} attribution={baseLayer.attribution} />
            {/* Rain radar overlay */}
            {layer.overlay === 'rainviewer' && radarUrl && (
              <TileLayer
                key={radarUrl}
                url={radarUrl}
                attribution="&copy; RainViewer"
                opacity={0.7}
                maxNativeZoom={10}
                maxZoom={18}
              />
            )}
            {layer.overlay && layer.overlay !== 'rainviewer' && (
              <TileLayer
                key={layer.overlay.url}
                url={layer.overlay.url}
                attribution={layer.overlay.attribution}
                opacity={layer.overlay.opacity || 0.5}
              />
            )}
            <Marker position={center}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', lineHeight: 1.5, minWidth: '140px' }}>
                  <strong style={{ fontSize: '13px' }}>{city}</strong>
                  <br />
                  {condition} &bull; <strong>{temperature}°C</strong>
                  <br />
                  Humidity: {humidity}% &bull; Wind: {windSpeed} km/h {windCompass}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="skeleton" style={{ height: '100%', width: '100%', borderRadius: 0 }}></div>
        )}
      </div>

      </motion.div>
    </>
  );
}
