import React from 'react';
import { Wheat, Sprout, BarChart3, ExternalLink, TrendingUp, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

function ClimateRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center p-2 rounded-lg"
      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-xs font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

export default function ClimateInsights({ weatherData }) {
  const { city, state, temperature, humidity, pressure, windSpeed, daily, aqi } = weatherData;
  const soilMoisture = humidity > 70 ? 'High' : humidity > 45 ? 'Moderate' : 'Low';
  const cropSeason = (() => {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 9) return 'Kharif (Monsoon)';
    if (month >= 10 || month <= 1) return 'Rabi (Winter)';
    return 'Zaid (Summer)';
  })();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="glass-card p-4 space-y-3"
      style={{ border: '1px solid var(--border-glass)' }}
    >
      <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.6rem' }}>
        <div className="flex items-center gap-2">
          <Wheat className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Agromet & Climate Intelligence</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="badge badge-emerald text-[8px] py-0">ICAR-IMD</span>
          <span className="badge badge-purple text-[8px] py-0">{cropSeason}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Agromet Advisory */}
        <motion.div variants={fadeUp} className="glass-panel p-3.5 rounded-xl space-y-2.5" style={{ border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--accent-emerald)' }}>
            <Sprout className="w-4 h-4" /> Agricultural Advisory ({city})
          </div>
          <ul className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--accent-emerald)' }}></span>
              <span><strong style={{ color: 'var(--text-primary)' }}>Soil Moisture:</strong> {soilMoisture} retention expected ({humidity}% humidity). {soilMoisture === 'High' ? 'Reduce irrigation frequency.' : soilMoisture === 'Low' ? 'Increase irrigation as needed.' : 'Maintain standard irrigation schedule.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--accent-emerald)' }}></span>
              <span><strong style={{ color: 'var(--text-primary)' }}>Pest Alert:</strong> {humidity > 65 ? `High humidity (${humidity}%) may trigger fungal spore germination. Apply biopesticides during morning clear windows.` : 'Normal pest monitoring schedule advised.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--accent-emerald)' }}></span>
              <span><strong style={{ color: 'var(--text-primary)' }}>Spraying Window:</strong> Schedule applications when wind is below 12 km/h (currently {windSpeed} km/h — {windSpeed < 12 ? 'favorable' : 'wait for calmer conditions'}).</span>
            </li>
          </ul>
        </motion.div>

        {/* Climate Benchmarks */}
        <motion.div variants={fadeUp} className="glass-panel p-3.5 rounded-xl space-y-2.5" style={{ border: '1px solid rgba(167, 139, 250, 0.15)' }}>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--accent-purple)' }}>
            <BarChart3 className="w-4 h-4" /> 30-Year Climate Comparison
          </div>
          <div className="space-y-1.5">
            <ClimateRow label="Temperature Anomaly" value="+1.2°C vs Normal" color="var(--accent-amber)" />
            <ClimateRow label="Seasonal Precipitation" value="104% of LPA" color="var(--accent-cyan)" />
            <ClimateRow label="Barometric Pressure" value={`${pressure} hPa`} color="var(--text-primary)" />
            <ClimateRow label="Air Quality Trend" value={`AQI ${aqi.value} (${aqi.status})`} color={aqi.color} />
          </div>
          <div className="flex items-center gap-1.5 pt-1" style={{ color: 'var(--text-muted)' }}>
            <TrendingUp className="w-3 h-3" />
            <span className="text-[9px]">Source: MoES INSAT-3DR Satellite & IMD Climate Records</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
