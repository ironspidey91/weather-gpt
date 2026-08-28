# WeatherGPT

**Conversational AI for Weather Forecasting, Alerts & Climate Intelligence**

Built for Smart India Hackathon Problem Statement **SIH26068** — Ministry of Earth Sciences (MoES) / Space Technology

---

## Features

- **AI Chat Assistant** — Natural language weather conversations with markdown rendering, voice input (Web Speech API), and text-to-speech output
- **Real-Time Weather** — Live data from Open-Meteo API with 26+ city stations (India & international)
- **Interactive Map** — Leaflet-powered GIS map with CartoDB dark/light tiles and weather marker popups
- **Forecast Charts** — 24-hour temperature curves and 7-day forecast with Recharts
- **Dynamic Alerts** — Auto-generated weather alerts based on actual conditions (rain, heat, wind, AQI)
- **AQI Monitoring** — Air Quality Index with SVG gauge, health advisories, and PM2.5/PM10 tracking
- **Agromet Advisory** — Crop-specific farming guidance for Kharif/Rabi/Zaid seasons
- **Climate Intelligence** — 30-year benchmark comparisons and INSAT-3DR satellite data references
- **Dark/Light Theme** — Persistent theme toggle with smooth CSS transitions
- **Geolocation** — Auto-detect user location via browser Geolocation API
- **Animated Backgrounds** — Canvas-based weather effects (rain, snow, fog, lightning, sun glow)
- **Mobile Responsive** — Tabbed navigation (Chat/Dashboard/Map) on small screens
- **Gemini API Ready** — Optional integration with Google Gemini for enhanced AI conversations

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite 5 | Build Tool |
| Framer Motion | Animations & Transitions |
| Recharts | Data Visualization |
| React-Leaflet | Interactive Maps |
| React-Markdown | Chat Response Rendering |
| Lucide React | Icon System |
| Open-Meteo API | Live Weather Data |
| Web Speech API | Voice Input/Output |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables (Optional)

Create a `.env` file from the example:

```bash
cp .env.example .env
```

```env
# Optional: Gemini API key for AI-powered conversations
# Without this, WeatherGPT uses its built-in intelligent response engine
VITE_GEMINI_API_KEY=your_api_key_here
```

## Project Structure

```
src/
  App.jsx                    # App shell with theme, geolocation, routing
  main.jsx                   # React entry point
  index.css                  # Design system (dark/light themes, glassmorphism)
  components/
    Header.jsx               # Navigation, search, theme toggle, voice toggle
    ChatInterface.jsx        # AI chat with markdown, voice input, animations
    WeatherDashboard.jsx     # Metrics cards, AQI gauge, wind compass
    ForecastCharts.jsx       # Hourly/daily forecast with Recharts
    WeatherMap.jsx           # Interactive Leaflet map
    AlertsBanner.jsx         # Dynamic weather alerts with modal
    ClimateInsights.jsx      # Agromet advisory & climate benchmarks
    BackgroundEffects.jsx    # Canvas weather animations
  services/
    weatherService.js        # Open-Meteo API, caching, geolocation
    aiService.js             # Gemini API + 30+ intent fallback engine
```

## API

WeatherGPT uses the **Open-Meteo API** (free, no API key required) for real-time weather data. The Gemini API integration is optional and enhances the AI chat experience.

## License

MIT
