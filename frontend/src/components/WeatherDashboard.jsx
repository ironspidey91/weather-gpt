import React, { useState, useEffect, useRef } from 'react';
import { Thermometer, Droplets, Wind, Gauge, Sun, Compass, Activity, ArrowUp, Sunrise, Sunset, CloudSun, CloudRain, CloudSnow, CloudLightning, Cloud, CloudFog, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

// Animated counter hook
function useAnimatedNumber(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    startRef.current = 0;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

function getTempGradientClass(temp) {
  if (temp <= 10) return 'text-gradient-cold';
  if (temp <= 25) return 'text-gradient-mild';
  if (temp <= 35) return 'text-gradient-warm';
  return 'text-gradient-hot';
}

function getAmbientColor(conditionCategory) {
  switch (conditionCategory) {
    case 'clear': return 'rgba(255, 200, 80, 0.12)';
    case 'rain': case 'heavy_rain': return 'rgba(59, 130, 246, 0.12)';
    case 'thunderstorm': return 'rgba(139, 92, 246, 0.15)';
    case 'snow': return 'rgba(200, 220, 255, 0.12)';
    case 'fog': return 'rgba(148, 163, 184, 0.1)';
    default: return 'rgba(6, 182, 212, 0.08)';
  }
}

function getWeatherIcon(conditionCategory) {
  switch (conditionCategory) {
    case 'clear': return '☀️';
    case 'partly_cloudy': return '⛅';
    case 'cloudy': return '☁️';
    case 'rain': return '🌧️';
    case 'heavy_rain': return '🌧️';
    case 'thunderstorm': return '⛈️';
    case 'snow': return '🌨️';
    case 'fog': return '🌫️';
    default: return '🌤️';
  }
}

function MetricCard({ icon: Icon, label, value, unit, accent, progress }) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-card-interactive flex items-center gap-2.5 p-3 rounded-xl group"
      style={{
        border: '1px solid var(--border-glass)',
        '--card-accent': accent,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 0 20px ${accent}15, var(--shadow-xl)`;
        e.currentTarget.style.borderColor = `${accent}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = 'var(--border-glass)';
      }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 relative"
        style={{ background: accent + '12', border: `1px solid ${accent}30`, color: accent }}>
        <Icon className="w-4 h-4" />
        {/* Mini progress ring */}
        {progress !== undefined && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke={accent + '15'} strokeWidth="2" />
            <motion.circle
              cx="18" cy="18" r="16" fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 16}
              initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - Math.min(1, progress)) }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
        )}
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

  // Gradient stops for multi-color arc
  const gradId = 'aqi-grad-' + Math.random().toString(36).slice(2, 6);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="75%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="38" fill="none" stroke="var(--border-glass)" strokeWidth="5" />
          <motion.circle
            cx="40" cy="40" r="38" fill="none"
            stroke={`url(#${gradId})`} strokeWidth="5" strokeLinecap="round"
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
            transition={{ duration: 1.2, type: 'spring', stiffness: 60, damping: 12 }}
          >
            <ArrowUp className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
          </motion.div>
        </div>
        {/* Compass ticks */}
        {[0, 90, 180, 270].map(deg => (
          <div key={deg} className="absolute w-1 h-1 rounded-full" style={{
            background: 'var(--text-muted)',
            opacity: 0.4,
            top: `${50 - 46 * Math.cos(deg * Math.PI / 180)}%`,
            left: `${50 + 46 * Math.sin(deg * Math.PI / 180)}%`,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}
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
    pressure, uvIndex, aqi, condition, conditionIcon, conditionCategory, sunrise, sunset, coords, fetchedAt
  } = weatherData;

  const animatedTemp = useAnimatedNumber(temperature, 1000);
  const lastUpdated = fetchedAt ? new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
  const tempGradientClass = getTempGradientClass(temperature);
  const ambientColor = getAmbientColor(conditionCategory);
  const weatherEmoji = getWeatherIcon(conditionCategory);

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
        {/* Ambient glow orb */}
        <div className="ambient-glow"
          style={{
            width: '200px', height: '200px',
            top: '-40px', right: '-20px',
            background: ambientColor,
          }}
        />
        <div className="ambient-glow"
          style={{
            width: '120px', height: '120px',
            bottom: '-20px', left: '20%',
            background: ambientColor,
            animationDelay: '2s',
          }}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-cyan text-[9px]">{state}</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {coords.lat.toFixed(2)}°N, {coords.lon.toFixed(2)}°E
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                {city}
              </h2>
              <div className="live-dot" />
            </div>
            <p className="text-sm flex items-center gap-2 mt-1" style={{ color: 'var(--text-secondary)' }}>
              <span className="text-xl">{weatherEmoji}</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{condition}</span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="flex items-baseline gap-0.5">
              <motion.span
                className={`text-5xl font-black tracking-tight ${tempGradientClass}`}
                style={{ fontFamily: 'var(--font-heading)', lineHeight: 1 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {animatedTemp}
              </motion.span>
              <span className="text-2xl font-light" style={{ color: 'var(--accent-cyan)' }}>°C</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Feels like <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{feelsLike}°C</span>
            </p>
            <p className="text-[9px] mt-0.5 flex items-center gap-1 sm:justify-end" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Updated {lastUpdated}
            </p>
          </div>
        </div>

        {/* Quick metrics row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-glass)' }}>
          <MetricCard icon={Droplets}     label="Humidity"   value={humidity}   unit="%"   accent="#3b82f6" progress={humidity / 100} />
          <MetricCard icon={Gauge}        label="Pressure"   value={pressure}   unit="hPa" accent="#6366f1" progress={Math.min(1, (pressure - 950) / 100)} />
          <MetricCard icon={Sun}          label="UV Index"   value={uvIndex}    unit="/11" accent="#f59e0b" progress={uvIndex / 11} />
          <MetricCard icon={Thermometer}  label="Feels Like" value={feelsLike}  unit="°C"  accent="#f43f5e" progress={Math.min(1, Math.max(0, (feelsLike + 10) / 60))} />
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
            <motion.div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
              whileHover={{ scale: 1.1, rotate: 15 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Sunrise className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </motion.div>
            <div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sunrise</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{sunrise}</p>
            </div>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--border-glass)' }}></div>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
              whileHover={{ scale: 1.1, rotate: -15 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Sunset className="w-4 h-4" style={{ color: '#6366f1' }} />
            </motion.div>
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
