// ================================================================
// WeatherGPT v2.0 — Weather Data Service
// Powered by Open-Meteo API with geolocation & caching
// ================================================================

const CITY_COORDINATES = {
  // India — Major Cities
  "New Delhi":    { lat: 28.6139, lon: 77.2090, state: "Delhi",              region: "North India" },
  "Mumbai":       { lat: 19.0760, lon: 72.8777, state: "Maharashtra",        region: "West India" },
  "Bengaluru":    { lat: 12.9716, lon: 77.5946, state: "Karnataka",          region: "South India" },
  "Kolkata":      { lat: 22.5726, lon: 88.3639, state: "West Bengal",        region: "East India" },
  "Chennai":      { lat: 13.0827, lon: 80.2707, state: "Tamil Nadu",         region: "South India" },
  "Hyderabad":    { lat: 17.3850, lon: 78.4867, state: "Telangana",          region: "South India" },
  "Pune":         { lat: 18.5204, lon: 73.8567, state: "Maharashtra",        region: "West India" },
  "Ahmedabad":    { lat: 23.0225, lon: 72.5714, state: "Gujarat",            region: "West India" },
  "Jaipur":       { lat: 26.9124, lon: 75.7873, state: "Rajasthan",          region: "North India" },
  "Lucknow":      { lat: 26.8467, lon: 80.9462, state: "Uttar Pradesh",      region: "North India" },
  "Bhopal":       { lat: 23.2599, lon: 77.4126, state: "Madhya Pradesh",     region: "Central India" },
  "Chandigarh":   { lat: 30.7333, lon: 76.7794, state: "Chandigarh",         region: "North India" },
  "Bhubaneswar":  { lat: 20.2961, lon: 85.8245, state: "Odisha",             region: "East India" },
  "Guwahati":     { lat: 26.1445, lon: 91.7362, state: "Assam",              region: "Northeast India" },
  "Shimla":       { lat: 31.1048, lon: 77.1734, state: "Himachal Pradesh",    region: "North India" },
  "Kochi":        { lat: 9.9312,  lon: 76.2673, state: "Kerala",             region: "South India" },
  "Thiruvananthapuram": { lat: 8.5241, lon: 76.9366, state: "Kerala",        region: "South India" },
  "Patna":        { lat: 25.6093, lon: 85.1376, state: "Bihar",              region: "East India" },
  "Ranchi":       { lat: 23.3441, lon: 85.3096, state: "Jharkhand",          region: "East India" },
  "Visakhapatnam":{ lat: 17.6868, lon: 83.2185, state: "Andhra Pradesh",     region: "South India" },
  // International
  "Tokyo":        { lat: 35.6762, lon: 139.6503, state: "Kanto",             region: "Japan" },
  "London":       { lat: 51.5074, lon: -0.1278,  state: "England",           region: "United Kingdom" },
  "New York":     { lat: 40.7128, lon: -74.0060,  state: "New York",         region: "United States" },
  "Dubai":        { lat: 25.2048, lon: 55.2708,  state: "Dubai",             region: "UAE" },
  "Singapore":    { lat: 1.3521,  lon: 103.8198, state: "Singapore",         region: "Singapore" },
  "Sydney":       { lat: -33.8688, lon: 151.2093, state: "NSW",              region: "Australia" },
};

// Cache weather data for 10 minutes
const weatherCache = new Map();
const CACHE_DURATION_MS = 10 * 60 * 1000;

function getCachedData(key) {
  const entry = weatherCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION_MS) {
    return entry.data;
  }
  weatherCache.delete(key);
  return null;
}

function setCachedData(key, data) {
  weatherCache.set(key, { data, timestamp: Date.now() });
}

// Wind direction degrees to compass label
function windDegreesToCompass(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(deg / 22.5) % 16];
}

// WMO Weather code interpretation
function getWeatherCondition(code, isDay = true) {
  if (code === 0)                return { label: "Clear Sky",            icon: isDay ? "sun" : "moon",   category: "clear" };
  if (code >= 1 && code <= 2)    return { label: "Partly Cloudy",        icon: "cloud-sun",              category: "cloudy" };
  if (code === 3)                return { label: "Overcast",             icon: "cloud",                  category: "cloudy" };
  if (code >= 45 && code <= 48)  return { label: "Fog & Mist",           icon: "cloud-fog",              category: "fog" };
  if (code >= 51 && code <= 55)  return { label: "Drizzle",              icon: "cloud-drizzle",          category: "rain" };
  if (code >= 56 && code <= 57)  return { label: "Freezing Drizzle",     icon: "cloud-drizzle",          category: "rain" };
  if (code >= 61 && code <= 65)  return { label: "Rain",                 icon: "cloud-rain",             category: "rain" };
  if (code >= 66 && code <= 67)  return { label: "Freezing Rain",        icon: "cloud-rain",             category: "rain" };
  if (code >= 71 && code <= 75)  return { label: "Snowfall",             icon: "snowflake",              category: "snow" };
  if (code === 77)               return { label: "Snow Grains",          icon: "snowflake",              category: "snow" };
  if (code >= 80 && code <= 82)  return { label: "Rain Showers",         icon: "cloud-rain-wind",        category: "heavy_rain" };
  if (code >= 85 && code <= 86)  return { label: "Snow Showers",         icon: "snowflake",              category: "snow" };
  if (code === 95)               return { label: "Thunderstorm",         icon: "cloud-lightning",        category: "thunderstorm" };
  if (code >= 96 && code <= 99)  return { label: "Severe Thunderstorm",  icon: "cloud-lightning",        category: "thunderstorm" };
  return { label: "Partly Cloudy", icon: "cloud", category: "cloudy" };
}

function calculateAQI(cityName, humidity) {
  // Simulated AQI based on city pollution profiles + humidity modulation
  const cityProfiles = {
    "New Delhi": 195, "Kolkata": 145, "Mumbai": 115, "Lucknow": 170,
    "Patna": 160, "Ahmedabad": 95, "Hyderabad": 75, "Chennai": 65,
    "Bengaluru": 45, "Pune": 70, "Kochi": 35, "Shimla": 28,
    "Guwahati": 80, "Bhubaneswar": 72, "Jaipur": 130,
    "Tokyo": 42, "London": 38, "New York": 55, "Dubai": 88,
    "Singapore": 50, "Sydney": 30
  };
  const base = cityProfiles[cityName] || 65;
  const variation = ((humidity || 60) % 20) * 2;
  const value = Math.min(450, Math.max(15, base + variation));

  let status, color;
  if (value <= 50)      { status = "Good";                       color = "#10b981"; }
  else if (value <= 100){ status = "Moderate";                   color = "#f59e0b"; }
  else if (value <= 150){ status = "Unhealthy for Sensitive";    color = "#f97316"; }
  else if (value <= 200){ status = "Unhealthy";                  color = "#ef4444"; }
  else if (value <= 300){ status = "Very Unhealthy";             color = "#a855f7"; }
  else                  { status = "Hazardous";                  color = "#991b1b"; }

  return { value, status, color };
}

function formatOpenMeteoResponse(cityName, cityInfo, data) {
  const current = data.current;
  const isDay = current.is_day === 1;
  const condition = getWeatherCondition(current.weather_code, isDay);

  const hourly = data.hourly.time.slice(0, 24).map((timeStr, i) => ({
    time: new Date(timeStr).getHours().toString().padStart(2, '0') + ":00",
    temp: Math.round(data.hourly.temperature_2m[i]),
    humidity: data.hourly.relative_humidity_2m[i],
    pop: data.hourly.precipitation_probability?.[i] || 10,
    uv: data.hourly.uv_index?.[i] || 2,
    wind: Math.round(data.hourly.wind_speed_10m[i])
  }));

  const daily = data.daily.time.map((timeStr, i) => {
    const dateObj = new Date(timeStr);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const cond = getWeatherCondition(data.daily.weather_code[i], true);
    return {
      date: timeStr,
      day: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayName,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      condition: cond.label,
      conditionIcon: cond.icon,
      pop: data.daily.precipitation_probability_max?.[i] || 15,
      uvMax: data.daily.uv_index_max?.[i] || 6
    };
  });

  const windDir = current.wind_direction_10m;

  return {
    city: cityName,
    state: cityInfo.state,
    region: cityInfo.region,
    coords: { lat: cityInfo.lat, lon: cityInfo.lon },
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    windDirection: windDir,
    windCompass: windDegreesToCompass(windDir),
    windGusts: Math.round(current.wind_gusts_10m || current.wind_speed_10m * 1.4),
    pressure: Math.round(current.pressure_msl || 1013),
    cloudCover: current.cloud_cover,
    precipitation: current.precipitation,
    isDay,
    condition: condition.label,
    conditionIcon: condition.icon,
    conditionCategory: condition.category,
    uvIndex: Math.round(data.daily.uv_index_max?.[0] || 6),
    aqi: calculateAQI(cityName, current.relative_humidity_2m),
    sunrise: data.daily.sunrise?.[0]
      ? new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "06:05 AM",
    sunset: data.daily.sunset?.[0]
      ? new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "06:45 PM",
    hourly,
    daily,
    fetchedAt: Date.now()
  };
}

function getFallbackWeatherData(cityName, cityInfo) {
  return {
    city: cityName,
    state: cityInfo.state,
    region: cityInfo.region,
    coords: { lat: cityInfo.lat, lon: cityInfo.lon },
    temperature: 28, feelsLike: 31, humidity: 68,
    windSpeed: 14, windDirection: 180, windCompass: "S", windGusts: 22,
    pressure: 1012, cloudCover: 40, precipitation: 0.2,
    isDay: true,
    condition: "Partly Cloudy",
    conditionIcon: "cloud-sun",
    conditionCategory: "cloudy",
    uvIndex: 7,
    aqi: { value: 92, status: "Moderate", color: "#f59e0b" },
    sunrise: "06:10 AM", sunset: "06:42 PM",
    hourly: Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      temp: 24 + Math.floor(Math.sin(i / 3) * 6),
      humidity: 60 + Math.floor(Math.cos(i / 3) * 15),
      pop: (i > 12 && i < 18) ? 60 : 15,
      uv: (i >= 10 && i <= 16) ? 8 : 1,
      wind: 10 + (i % 5)
    })),
    daily: [
      { date: "2026-08-27", day: "Today",    maxTemp: 31, minTemp: 24, condition: "Partly Cloudy", conditionIcon: "cloud-sun", pop: 30, uvMax: 7 },
      { date: "2026-08-28", day: "Tomorrow", maxTemp: 30, minTemp: 23, condition: "Light Rain",    conditionIcon: "cloud-rain", pop: 70, uvMax: 5 },
      { date: "2026-08-29", day: "Sat",      maxTemp: 29, minTemp: 23, condition: "Thunderstorm",  conditionIcon: "cloud-lightning", pop: 85, uvMax: 4 },
      { date: "2026-08-30", day: "Sun",      maxTemp: 32, minTemp: 25, condition: "Sunny Spells",  conditionIcon: "sun", pop: 20, uvMax: 8 },
      { date: "2026-08-31", day: "Mon",      maxTemp: 33, minTemp: 26, condition: "Hot & Humid",   conditionIcon: "sun", pop: 10, uvMax: 9 },
      { date: "2026-09-01", day: "Tue",      maxTemp: 31, minTemp: 24, condition: "Showers",       conditionIcon: "cloud-rain", pop: 50, uvMax: 6 },
      { date: "2026-09-02", day: "Wed",      maxTemp: 30, minTemp: 23, condition: "Cloudy",        conditionIcon: "cloud", pop: 40, uvMax: 6 }
    ],
    fetchedAt: Date.now()
  };
}

// Search any city/town using Open-Meteo Geocoding API (free, no key)
const geocodeCache = new Map();

export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  if (geocodeCache.has(q)) return geocodeCache.get(q);

  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data.results || []).map(r => ({
      name: r.name,
      state: r.admin1 || r.country || '',
      country: r.country || '',
      lat: r.latitude,
      lon: r.longitude,
      displayName: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}`,
      region: getRegionFromCoords(r.latitude, r.longitude, r.country),
    }));
    geocodeCache.set(q, results);
    return results;
  } catch {
    return [];
  }
}

function getRegionFromCoords(lat, lon, country) {
  if (country !== 'India') return country || 'International';
  if (lat > 30) return 'North India';
  if (lat > 25 && lon < 78) return 'North India';
  if (lat > 25 && lon >= 78) return 'East India';
  if (lat > 20 && lon < 76) return 'West India';
  if (lat > 20 && lon >= 76 && lon < 82) return 'Central India';
  if (lat > 20 && lon >= 82) return 'East India';
  if (lon >= 90) return 'Northeast India';
  if (lat <= 20) return 'South India';
  return 'India';
}

// Dynamic city info store — persists geocoded cities for the session
const dynamicCities = {};

export function registerCity(name, info) {
  dynamicCities[name] = info;
}

function getCityInfo(cityName) {
  return CITY_COORDINATES[cityName] || dynamicCities[cityName] || null;
}

export async function fetchWeatherData(cityName = "New Delhi") {
  const cached = getCachedData(cityName);
  if (cached) return cached;

  let city = getCityInfo(cityName);

  // If city not in our lists, try geocoding it
  if (!city) {
    try {
      const results = await searchCities(cityName);
      if (results.length > 0) {
        city = { lat: results[0].lat, lon: results[0].lon, state: results[0].state, region: results[0].region };
        dynamicCities[cityName] = city;
      }
    } catch { /* fall through */ }
  }

  if (!city) city = CITY_COORDINATES["New Delhi"];

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,surface_pressure,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API response: ${res.status}`);
    const data = await res.json();

    const formatted = formatOpenMeteoResponse(cityName, city, data);
    setCachedData(cityName, formatted);
    return formatted;
  } catch (err) {
    console.warn("Using fallback weather data:", err.message);
    const fallback = getFallbackWeatherData(cityName, city);
    setCachedData(cityName, fallback);
    return fallback;
  }
}

// Reverse geocode coordinates to city name using Open-Meteo Geocoding
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1&language=en&format=json`);
    // Geocoding API doesn't support reverse lookup directly, so find nearest from known + use Nominatim fallback
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      const cityName = nomData.address?.city || nomData.address?.town || nomData.address?.village || nomData.address?.county || "New Delhi";
      const state = nomData.address?.state || '';
      // Register this city dynamically
      dynamicCities[cityName] = { lat, lon, state, region: getRegionFromCoords(lat, lon, nomData.address?.country || 'India') };
      return cityName;
    }
  } catch { /* fall through */ }

  // Fallback: find nearest from hardcoded list
  let nearest = "New Delhi";
  let minDist = Infinity;
  for (const [name, info] of Object.entries(CITY_COORDINATES)) {
    const d = Math.sqrt(Math.pow(lat - info.lat, 2) + Math.pow(lon - info.lon, 2));
    if (d < minDist) { minDist = d; nearest = name; }
  }
  return nearest;
}

// Get user's location using browser Geolocation API
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}

export const CITY_LIST = Object.keys(CITY_COORDINATES);
export { CITY_COORDINATES };
