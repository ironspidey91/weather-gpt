import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Layers, Maximize2, Minimize2, Thermometer, Wind, Satellite } from 'lucide-react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Map layer configurations (all 100% free, no API key needed) ──
const MAP_LAYERS = {
  standard: {
    label: 'Standard',
    icon: Layers,
    base: {
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
      light: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    overlay: null,
  },
  temperature: {
    label: 'Thermal',
    icon: Thermometer,
    base: {
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
      light: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
    },
    overlay: null,
  },
  wind: {
    label: 'Wind',
    icon: Wind,
    base: {
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
      light: {
        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
    },
    overlay: null,
  },
  satellite: {
    label: 'Satellite',
    icon: Satellite,
    base: {
      dark: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
      light: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
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

export default function WeatherMap({ weatherData, theme }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('standard');
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef(null);

  const { city, coords, temperature, condition, humidity, windSpeed, windCompass } = weatherData;
  const center = [coords.lat, coords.lon];
  const themeKey = theme === 'light' ? 'light' : 'dark';
  const layer = MAP_LAYERS[activeLayer];
  const baseLayer = layer.base[themeKey];

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

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card relative ${isExpanded ? 'fixed inset-4 z-50' : ''}`}
      style={{ border: '1px solid var(--border-glass)', flexShrink: 0, minHeight: isExpanded ? undefined : '380px', overflow: 'hidden' }}
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
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={isActive
                  ? { background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid transparent' }
                }
                title={cfg.label}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-glass)' }}></div>

          {/* Coordinates */}
          <div className="text-[10px] font-mono px-2 py-0.5 rounded hidden md:block" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
            {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
          </div>

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

      {/* Map container */}
      <div style={{ height: isExpanded ? 'calc(100% - 44px)' : '332px', width: '100%' }}>
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
            {/* Base layer */}
            <TileLayer key={baseLayer.url} url={baseLayer.url} attribution={baseLayer.attribution} />
            {/* Overlay layer (thermal, wind, etc.) */}
            {layer.overlay && (
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

      {/* Overlay when expanded */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsExpanded(false)}></div>
      )}
    </motion.div>
  );
}
