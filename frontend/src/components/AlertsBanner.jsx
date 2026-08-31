import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, ChevronRight, X, PhoneCall, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function generateAlerts(weatherData) {
  const alerts = [];
  const { city, state, region, windSpeed, humidity, temperature, daily, aqi } = weatherData;

  // Thunderstorm / heavy rain alert
  if (daily[0]?.pop > 60 || daily[1]?.pop > 70) {
    alerts.push({
      id: `ALT-${Date.now()}-1`,
      severity: 'ORANGE',
      title: 'Heavy Rainfall & Thunderstorm Advisory',
      region: `${region} (${state})`,
      issuedBy: 'India Meteorological Department (IMD) / MoES',
      validTill: 'Next 24 Hours',
      details: `Radar observations confirm convective cloud cells with ${daily[0]?.pop}% precipitation probability today. Localized heavy rainfall expected with possible waterlogging in low-lying areas.`,
      safetyTips: [
        'Avoid sheltering under isolated trees during lightning activity',
        'Secure loose outdoor belongings and cover vehicles',
        'Commuters should exercise caution on wet roadways and underpasses'
      ]
    });
  }

  // Heat alert
  if (temperature > 38) {
    alerts.push({
      id: `ALT-${Date.now()}-2`,
      severity: 'RED',
      title: 'Extreme Heat Warning',
      region: `${city} & surrounding districts`,
      issuedBy: 'National Disaster Management Authority (NDMA)',
      validTill: 'Until temperature drops below 38°C',
      details: `Temperature has reached ${temperature}°C. Heat index is critically elevated due to ${humidity}% humidity.`,
      safetyTips: [
        'Stay indoors during peak hours (11 AM - 4 PM)',
        'Maintain hydration with ORS, coconut water, or fresh fluids',
        'Check on elderly and children frequently'
      ]
    });
  }

  // High wind alert
  if (windSpeed > 35) {
    alerts.push({
      id: `ALT-${Date.now()}-3`,
      severity: 'YELLOW',
      title: 'High Wind Advisory',
      region: `${city} (${state})`,
      issuedBy: 'IMD Regional Centre',
      validTill: 'Next 12 Hours',
      details: `Wind speeds reaching ${windSpeed} km/h. Gusty conditions may affect outdoor structures and transportation.`,
      safetyTips: [
        'Secure loose objects, temporary structures, and outdoor signage',
        'Avoid high-rise balconies and exposed areas',
        'Fishermen advised to avoid deep sea venture'
      ]
    });
  }

  // AQI alert
  if (aqi.value > 150) {
    alerts.push({
      id: `ALT-${Date.now()}-4`,
      severity: aqi.value > 200 ? 'RED' : 'ORANGE',
      title: 'Air Quality Health Advisory',
      region: `${city} Metro Area`,
      issuedBy: 'Central Pollution Control Board (CPCB)',
      validTill: 'Until AQI improves',
      details: `AQI at ${aqi.value} (${aqi.status}). Primary pollutants: PM2.5 & PM10. Health-sensitive individuals should take precautions.`,
      safetyTips: [
        'Wear N95 masks outdoors, especially during commute',
        'Keep windows closed and run indoor HEPA air purifiers',
        'Limit outdoor physical exertion and exercise'
      ]
    });
  }

  // Default demo alert if none generated
  if (alerts.length === 0) {
    alerts.push({
      id: `ALT-${Date.now()}-0`,
      severity: 'YELLOW',
      title: 'Elevated Humidity & Heat Index Watch',
      region: `${city} District`,
      issuedBy: 'National Disaster Management Authority (NDMA)',
      validTill: 'Next 48 Hours',
      details: `Heat index predicted to reach ${Math.round(temperature * 1.05)}°C due to high humidity (${humidity}%). Thermal discomfort likely during afternoon hours.`,
      safetyTips: [
        'Maintain adequate hydration with ORS or fresh fluids',
        'Wear loose, light-colored cotton attire',
        'Avoid prolonged outdoor exposure between 12-4 PM'
      ]
    });
  }

  return alerts;
}

const SEVERITY_COLORS = {
  RED:    { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.35)', text: '#fb7185', badgeClass: 'badge-red' },
  ORANGE: { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.35)', text: '#fb923c', badgeClass: 'badge-orange' },
  YELLOW: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', badgeClass: 'badge-amber' },
};

export default function AlertsBanner({ weatherData, externalOpen, onExternalClose }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Allow external trigger (header alert button)
  const isModalOpen = modalOpen || externalOpen;
  const closeModal = () => {
    setModalOpen(false);
    if (onExternalClose) onExternalClose();
  };
  const alerts = generateAlerts(weatherData);
  const topAlert = alerts[0];
  const sev = SEVERITY_COLORS[topAlert.severity] || SEVERITY_COLORS.YELLOW;

  if (dismissed) return null;

  return (
    <>
      {/* Alert Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl p-3 flex items-center justify-between gap-3"
        style={{ background: `linear-gradient(135deg, ${sev.bg}, rgba(99, 102, 241, 0.06))`, border: `1px solid ${sev.border}` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 animate-pulse"
            style={{ background: sev.bg, border: `1px solid ${sev.border}`, color: sev.text }}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${sev.badgeClass} text-[9px] py-0`}>{topAlert.severity} ALERT</span>
              <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{topAlert.title}</span>
            </div>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              {weatherData.city} ({weatherData.state}) &bull; Valid: {topAlert.validTill}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setModalOpen(true)}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
            style={{ border: `1px solid ${sev.border}`, color: sev.text, background: 'transparent' }}
            id="view-bulletin-btn"
          >
            Details <ChevronRight className="w-3 h-3" />
          </button>
          <button onClick={() => setDismissed(true)} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full h-full min-h-screen rounded-none p-5 relative overflow-y-auto"
              style={{ border: `1px solid ${sev.border}` }}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={closeModal}
                className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}>
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <ShieldAlert className="w-6 h-6" style={{ color: sev.text }} />
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>MoES Emergency Weather Bulletin</h2>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Integrated Disaster Warning Platform</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {alerts.map(alert => {
                  const s = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.YELLOW;
                  return (
                    <div key={alert.id} className="glass-panel p-4 rounded-xl space-y-2" style={{ border: `1px solid ${s.border}` }}>
                      <div className="flex items-center justify-between">
                        <span className={`badge ${s.badgeClass} text-[9px]`}>{alert.severity} ADVISORY</span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{alert.id.slice(0, 16)}</span>
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{alert.title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{alert.details}</p>
                      <div className="pt-2" style={{ borderTop: '1px solid var(--border-glass)' }}>
                        <p className="text-[10px] font-bold mb-1" style={{ color: s.text }}>Recommended Precautions:</p>
                        <ul className="space-y-1">
                          {alert.safetyTips.map((tip, i) => (
                            <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                              <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'var(--accent-emerald)' }} />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}

                {/* Emergency helpline */}
                <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#fb7185' }}>
                    <PhoneCall className="w-4 h-4" />
                    <span>Emergency Helpline: <strong>1070 / 112</strong></span>
                  </div>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>MoES Emergency Grid</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
