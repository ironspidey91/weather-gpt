import React, { useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { Clock, CloudRain, Thermometer, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

function getHourWeatherEmoji(pop, temp) {
  if (pop > 60) return '🌧️';
  if (pop > 30) return '🌦️';
  if (temp > 35) return '☀️';
  if (temp > 20) return '🌤️';
  return '⛅';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-3 py-2 rounded-lg text-xs" style={{ border: '1px solid var(--border-glass-bright)' }}>
      <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }}></span>
          {p.name}: <strong>{p.value}{p.name === 'Temperature' ? '°C' : p.name === 'Rain' ? '%' : ''}</strong>
        </p>
      ))}
    </div>
  );
}

function DailyForecastCard({ day, index }) {
  const tempRange = day.maxTemp - day.minTemp;
  const barWidth = Math.max(30, Math.min(80, tempRange * 6));

  // Pick an emoji for the day
  const emoji = day.pop > 50 ? '🌧️' : day.maxTemp > 35 ? '☀️' : day.maxTemp > 25 ? '🌤️' : '⛅';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-panel p-3 rounded-xl flex items-center justify-between transition-all group"
      style={{ border: '1px solid var(--border-glass)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = 'translateX(0)'; }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-12 text-center shrink-0">
          <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{day.day}</p>
          <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{day.date.slice(5)}</p>
        </div>
        <span className="text-lg shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{day.condition}</p>
          {/* Temp range bar */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-mono" style={{ color: 'var(--accent-sky)' }}>{day.minTemp}°</span>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ width: `${barWidth}px`, background: 'var(--border-glass)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, #38bdf8, #f59e0b)` }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>{day.maxTemp}°</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2" style={{ color: 'var(--accent-cyan)' }}>
        <CloudRain className="w-3 h-3" />
        <span className="text-[10px] font-bold">{day.pop}%</span>
      </div>
    </motion.div>
  );
}

export default function ForecastCharts({ weatherData }) {
  const [tab, setTab] = useState('hourly');
  const scrollRef = useRef(null);
  const { hourly, daily } = weatherData;
  const currentHour = new Date().getHours();

  useEffect(() => {
    if (tab === 'hourly' && scrollRef.current) {
      const filteredIndex = hourly.filter((_, i) => i % 2 === 0).findIndex(h => parseInt(h.time) >= currentHour);
      if (filteredIndex > 0) {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              left: (filteredIndex * 72) - (scrollRef.current.clientWidth / 2) + 36,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    }
  }, [tab, hourly, currentHour]);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="glass-card p-4 space-y-3"
      style={{ border: '1px solid var(--border-glass)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Forecast Trends</h3>
        </div>
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg text-[11px]" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
          {['hourly', 'daily'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-2.5 py-1 rounded-md font-semibold transition-all"
              style={tab === t
                ? { background: 'var(--accent-cyan)', color: 'var(--bg-primary)', fontWeight: 700 }
                : { color: 'var(--text-muted)' }
              }
            >
              {t === 'hourly' ? '24-Hour' : '7-Day'}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      {tab === 'hourly' && (
        <div className="space-y-3 animate-fade-in">
          {/* Area Chart */}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} interval={2} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="temp" name="Temperature" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" animationDuration={1200} />
                <Area type="monotone" dataKey="pop" name="Rain" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#rainGrad)" strokeDasharray="4 3" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly scroll strip */}
          <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {hourly.filter((_, i) => i % 2 === 0).map((h, idx) => {
              const isCurrentHour = parseInt(h.time) === currentHour;
              const emoji = getHourWeatherEmoji(h.pop, h.temp);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  className="shrink-0 w-16 p-2 rounded-xl text-center space-y-0.5 glass-panel"
                  style={{
                    border: isCurrentHour ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                    boxShadow: isCurrentHour ? '0 0 12px rgba(6, 182, 212, 0.2)' : 'none',
                    background: isCurrentHour ? 'rgba(6, 182, 212, 0.06)' : undefined,
                  }}
                >
                  <p className="text-[10px] font-semibold" style={{ color: isCurrentHour ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                    {isCurrentHour ? 'Now' : h.time}
                  </p>
                  <p className="text-xs">{emoji}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{h.temp}°</p>
                  <div className="flex items-center justify-center gap-0.5" style={{ color: 'var(--accent-cyan)' }}>
                    <Droplets className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-semibold">{h.pop}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'daily' && (
        <div className="space-y-2 animate-fade-in">
          {daily.map((day, idx) => (
            <DailyForecastCard key={idx} day={day} index={idx} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
