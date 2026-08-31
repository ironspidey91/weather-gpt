# WeatherGPT — Known Bugs & Issues Tracker

This document tracks identified bugs, edge cases, known limitations, and resolution statuses for the **WeatherGPT** application.

---

## 🐛 Open / Known Issues

| ID | Category | Description | Severity | Status | Workaround / Notes |
|---|---|---|---|---|---|
| **BUG-001** | AI Service | Groq API fails gracefully if `VITE_GROQ_API_KEY` is missing or invalid | Low | `Mitigated` | Fallback local intelligence engine automatically handles requests without breaking UI. |
| **BUG-002** | Voice AI | Web Speech API SpeechSynthesis unavailable on certain mobile browsers (e.g. Firefox iOS) | Low | `Open` | Feature detects API support and safely disables voice toggle button. |
| **BUG-003** | Map Component | Leaflet map container tiles sometimes flicker or render partially on browser window resize | Medium | `Open` | `map.invalidateSize()` called on tab switch; full fix requires resize observer trigger. |
| **BUG-004** | Geolocation | Geolocation permission denied fallback to default city (Kolkata) may take 2-3s on slow connections | Low | `Open` | Default city loads immediately while GPS lookup resolves asynchronously. |
| **BUG-005** | Backend | Flask backend `/ask` endpoint requires OpenWeather API key for hourly rain forecast breakdown | Medium | `Open` | Provide `OPENWEATHER_API_KEY` in `backend/.env`. |

---

## ✅ Resolved Bugs

| ID | Component | Description | Resolution | Resolved In |
|---|---|---|---|---|
| **FIX-001** | UI Routing | Off-topic AI chat queries rejecting valid weather prompts | Refactored regex intent matcher in `aiService.js` with comprehensive keyword dictionary | `v2.0` |
| **FIX-002** | Git Sync | Remote branch diverged with deleted React components | Merged `origin/main` updates while preserving full React application structure | Commit `10a1d8b` |

---

## 📋 Reporting New Bugs

When reporting a new bug, please include:
1. **Steps to Reproduce**: Detailed list of actions.
2. **Expected Behavior**: What should have happened.
3. **Actual Behavior**: What actually occurred (include error logs / screenshots).
4. **Environment**: Browser version, OS, and device type.
