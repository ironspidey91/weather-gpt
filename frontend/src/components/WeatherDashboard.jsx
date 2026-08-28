import React from 'react';
import { Thermometer, Droplets, Wind, Gauge, Sun, Compass, Activity, ArrowUp, Sunrise, Sunset } from 'lucide-react';
import { motion } from 'framer-motion';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

function MetricCard({ icon: Icon, label, value, unit, accent, delay }) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-card-interactive flex items-center gap-2.5 p-3 rounded-xl"
      style={{ border: '1px solid var(--border-glass)' }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent + '12', border: `1px solid ${accent}30`, color: accent }}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {value} {unit && <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
        </p>
      </div>
    </motion.div>
  );
}

function AQIGauge({ value, status, color }) {
  const maxAqi = 400;
  const pct = Math.min(100, (value / maxAqi) * 100);
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="38" fill="none" stroke="var(--border-glass)" strokeWidth="5" />
          <motion.circle
            cx="40" cy="40" r="38" fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Air Quality</p>
        <p className="text-xs font-bold" style={{ color }}>
          {status}
        </p>
        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>AQI US Scale</p>
      </div>
    </div>
  );
}

function WindCompass({ direction, speed, compass }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 shrink-0">
        <div className="w-full h-full rounded-full flex items-center justify-center"
          style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: direction }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <ArrowUp className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
          </motion.div>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Wind</p>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {speed} <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>km/h</span>
        </p>
        <p className="text-[10px] font-semibold" style={{ color: 'var(--accent-cyan)' }}>{compass}</p>
      </div>
    </div>
  );
}

export default function WeatherDashboard({ weatherData }) {
  const {
    city, state, temperature, feelsLike, humidity, windSpeed, windDirection, windCompass, windGusts,
    pressure, uvIndex, aqi, condition, conditionIcon, sunrise, sunset, coords, fetchedAt
  } = weatherData;

  const lastUpdated = fetchedAt ? new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-3"
    >
      {/* Hero Card */}
      <motion.div
        variants={fadeUp}
        className="glass-card p-5 relative overflow-hidden"
        style={{ border: '1px solid var(--border-glass)' }}
      >
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(6, 182, 212, 0.06)' }}></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-cyan text-[9px]">{state}</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {coords.lat.toFixed(2)}°N, {coords.lon.toFixed(2)}°E
              </span>
            </div>
            <h2 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              {city}
            </h2>
            <p className="text-sm flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{condition}</span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-4xl font-black tracking-tight flex items-baseline gap-0.5" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              {temperature}
              <span className="text-xl font-light" style={{ color: 'var(--accent-cyan)' }}>°C</span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Feels like <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{feelsLike}°C</span>
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Updated {lastUpdated}</p>
          </div>
        </div>

        {/* Quick metrics row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-glass)' }}>
          <MetricCard icon={Droplets}     label="Humidity"   value={humidity}   unit="%"   accent="#3b82f6" />
          <MetricCard icon={Gauge}        label="Pressure"   value={pressure}   unit="hPa" accent="#6366f1" />
          <MetricCard icon={Sun}          label="UV Index"   value={uvIndex}    unit="/11" accent="#f59e0b" />
          <MetricCard icon={Thermometer}  label="Feels Like" value={feelsLike}  unit="°C"  accent="#f43f5e" />
        </div>
      </motion.div>

      {/* AQI + Wind + Sun Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* AQI */}
        <motion.div variants={fadeUp} className="glass-card p-4" style={{ border: '1px solid var(--border-glass)' }}>
          <AQIGauge value={aqi.value} status={aqi.status} color={aqi.color} />
        </motion.div>

        {/* Wind */}
        <motion.div variants={fadeUp} className="glass-card p-4" style={{ border: '1px solid var(--border-glass)' }}>
          <WindCompass direction={windDirection} speed={windSpeed} compass={windCompass} />
          <p className="text-[9px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Gusts up to {windGusts} km/h</p>
        </motion.div>

        {/* Sunrise/Sunset */}
        <motion.div variants={fadeUp} className="glass-card p-4 flex items-center justify-around" style={{ border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <Sunrise className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sunrise</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{sunrise}</p>
            </div>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--border-glass)' }}></div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Sunset className="w-4 h-4" style={{ color: '#6366f1' }} />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sunset</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{sunset}</p>
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
