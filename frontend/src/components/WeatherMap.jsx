import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Layers, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import L from 'leaflet';

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILE_LAYERS = {
  dark: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  },
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};

// Recenter map when city changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useMemo(() => {
    map.setView(center, zoom, { animate: true, duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

export default function WeatherMap({ weatherData, theme }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { city, coords, temperature, condition, humidity, windSpeed, windCompass } = weatherData;
  const center = [coords.lat, coords.lon];
  const tileLayer = theme === 'light' ? TILE_LAYERS.light : TILE_LAYERS.dark;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card overflow-hidden relative ${isExpanded ? 'fixed inset-4 z-50' : ''}`}
      style={{ border: '1px solid var(--border-glass)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-glass)' }}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Live Weather Map</h3>
          <span className="badge badge-emerald text-[8px] py-0">Interactive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
            {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-icon w-7 h-7"
            title={isExpanded ? "Minimize" : "Fullscreen"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: isExpanded ? 'calc(100% - 48px)' : '280px' }}>
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{ height: '100%', width: '100%' }}
          className="z-10"
        >
          <MapUpdater center={center} zoom={10} />
          <TileLayer url={tileLayer.url} attribution={tileLayer.attribution} />
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
      </div>

      {/* Overlay when expanded */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsExpanded(false)}></div>
      )}
    </motion.div>
  );
}
