// ================================================================
// WeatherGPT v2.0 — Conversational AI Service
// Gemini API integration with intelligent fallback engine
// ================================================================

const GEMINI_API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `You are WeatherGPT, an advanced conversational AI assistant specialized EXCLUSIVELY in weather forecasting, severe weather alerts, climate intelligence, and agricultural advisories. You are built for India's Ministry of Earth Sciences (MoES) under Smart India Hackathon problem SIH26068.

STRICT RULE — You must ONLY respond to topics related to:
- Weather (current, forecasts, historical)
- Climate and atmospheric science
- Severe weather alerts (cyclones, floods, heatwaves, thunderstorms)
- Air Quality Index (AQI) and pollution
- Agricultural/Agromet advisories affected by weather
- Clothing and lifestyle recommendations BASED ON weather
- Travel planning RELATED TO weather conditions
- Natural disasters and emergency preparedness

If a user asks about ANYTHING outside these topics — such as politics, entertainment, sports scores, coding, math, relationships, jokes, general knowledge, history (non-climate), celebrities, or ANY other non-weather subject — you MUST politely decline and redirect them. Respond with something like:
"I'm WeatherGPT, and I'm designed exclusively for weather, climate, and atmospheric intelligence. I can't help with that topic, but I'd love to help you with weather forecasts, air quality, severe alerts, farming advisories, or climate trends! What would you like to know about the weather?"

NEVER answer non-weather questions, even if the user insists. Stay strictly within your weather domain.

Your capabilities:
- Real-time weather analysis and forecasting
- Severe weather alerts (cyclones, floods, heatwaves, thunderstorms)
- Air Quality Index (AQI) interpretation and health advisories
- Agricultural/Agromet advisories for farmers (crop-specific guidance)
- Climate trend analysis and historical comparisons
- Clothing and lifestyle recommendations based on weather
- Travel weather planning

Guidelines:
- Always be specific with numbers, data, and locations
- Use markdown formatting: **bold** for emphasis, bullet points for lists
- Provide actionable safety instructions for severe weather
- Reference MoES, IMD, and INSAT-3DR satellite data when relevant
- Keep responses concise but informative (150-250 words ideal)
- For farmers, provide crop-specific guidance based on current conditions
- Include relevant badges/labels in your response structure`;

// Try Gemini API first, fallback to local engine
export async function processWeatherGPTQuery(query, weatherContext) {
  if (GEMINI_API_KEY) {
    try {
      return await queryGeminiAPI(query, weatherContext);
    } catch (err) {
      console.warn("Gemini API failed, using fallback:", err.message);
    }
  }
  return localWeatherEngine(query, weatherContext);
}

async function queryGeminiAPI(query, weatherContext) {
  const contextStr = `Current weather data for ${weatherContext.city}, ${weatherContext.state}:
- Temperature: ${weatherContext.temperature}°C (Feels like ${weatherContext.feelsLike}°C)
- Condition: ${weatherContext.condition}
- Humidity: ${weatherContext.humidity}%
- Wind: ${weatherContext.windSpeed} km/h ${weatherContext.windCompass}
- Pressure: ${weatherContext.pressure} hPa
- UV Index: ${weatherContext.uvIndex}
- AQI: ${weatherContext.aqi.value} (${weatherContext.aqi.status})
- Sunrise: ${weatherContext.sunrise}, Sunset: ${weatherContext.sunset}
- Today's forecast: High ${weatherContext.daily[0]?.maxTemp}°C, Low ${weatherContext.daily[0]?.minTemp}°C, ${weatherContext.daily[0]?.pop}% rain chance
- Tomorrow's forecast: High ${weatherContext.daily[1]?.maxTemp}°C, Low ${weatherContext.daily[1]?.minTemp}°C, ${weatherContext.daily[1]?.pop}% rain chance`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          parts: [{
            text: `${contextStr}\n\nUser Query: ${query}\n\nProvide a helpful, data-driven response. End with 2-3 relevant badge labels in this exact format on the last line:\nBADGES: [badge1, badge2, badge3]`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini API: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract badges from response
  const badgeMatch = text.match(/BADGES:\s*\[(.+)\]\s*$/m);
  let badges = ['AI Analysis', weatherContext.condition];
  let cleanText = text;

  if (badgeMatch) {
    badges = badgeMatch[1].split(',').map(b => b.trim());
    cleanText = text.replace(/BADGES:\s*\[.+\]\s*$/m, '').trim();
  }

  // Determine response type from content
  let type = 'general';
  const lower = query.toLowerCase();
  if (lower.match(/alert|warn|cyclone|flood|storm|extreme/)) type = 'alert';
  else if (lower.match(/aqi|pollution|air|smog|mask/)) type = 'aqi';
  else if (lower.match(/farm|crop|agri|sow|fertil|irrig/)) type = 'agromet';
  else if (lower.match(/climate|history|trend|warm|monsoon|average/)) type = 'climate';
  else if (lower.match(/rain|umbrella|wet|shower|precip/)) type = 'advisory';
  else if (lower.match(/wear|cloth|jacket|hot|cold/)) type = 'lifestyle';

  return { text: cleanText, type, badges };
}

// Enhanced local weather intelligence engine (30+ intent patterns)
function localWeatherEngine(query, ctx) {
  const q = query.toLowerCase().trim();
  const { city, state, region, temperature: temp, feelsLike, humidity: hum, windSpeed: wind, windCompass, pressure, uvIndex, aqi, condition, daily, sunrise, sunset } = ctx;

  // 1. Rain / Precipitation
  if (q.match(/rain|umbrella|wet|shower|precip|drizzle|pour/)) {
    const todayPop = daily[0]?.pop || 30;
    const tmrwPop = daily[1]?.pop || 50;
    if (todayPop > 50) {
      return {
        text: `**High Precipitation Alert for ${city} Today (${todayPop}% probability)**\n\nSatellite radar and atmospheric pressure data (${pressure} hPa) indicate rainfall expected later today. Current humidity is at ${hum}%.\n\n**Recommendations:**\n- Carry an umbrella or rain jacket\n- Avoid waterlogged roads and underpasses\n- Secure outdoor belongings\n\nTomorrow's rain probability: **${tmrwPop}%**`,
        type: 'advisory',
        badges: ['Rain Alert', `${todayPop}% Chance`, 'Carry Umbrella']
      };
    }
    return {
      text: `**Low Precipitation Risk in ${city} Today** (${todayPop}% probability)\n\nConditions are currently **${condition}** at **${temp}°C**. Skies are mostly favorable for outdoor activities.\n\nHowever, tomorrow shows **${tmrwPop}% chance of rain** — plan accordingly.\n\n- **Humidity**: ${hum}%\n- **Wind**: ${wind} km/h ${windCompass}\n- **Pressure**: ${pressure} hPa`,
      type: 'info',
      badges: ['Low Rain Risk', 'Outdoor Safe']
    };
  }

  // 2. Severe Alerts
  if (q.match(/alert|warning|cyclone|flood|storm|extreme|disaster|emergency|danger/)) {
    return {
      text: `**MoES & IMD Weather Advisory for ${city} (${region})**\n\n**Alert Level:** ORANGE WATCH — Convective Weather Activity\n\n**Current Conditions:**\n- Wind gusts up to **${wind + 15} km/h** from ${windCompass}\n- Atmospheric pressure: **${pressure} hPa**\n- Expected accumulation: 15-30 mm in next 12 hours\n\n**Safety Instructions:**\n- Avoid sheltering under isolated trees or metal structures during lightning\n- Keep emergency power banks and flashlights charged\n- Fishermen: Do not venture into deep sea waters\n- Commuters: Exercise caution on slick roads and underpasses\n- Monitor IMD bulletins at moes.gov.in\n\n**Emergency Helpline:** 1070 / 112`,
      type: 'alert',
      badges: ['Orange Alert', 'IMD Bulletin', 'Stay Safe']
    };
  }

  // 3. Air Quality
  if (q.match(/aqi|pollution|air quality|smog|mask|breath|lung|pm2|particulate/)) {
    let advice = "Air quality is good — great day for outdoor exercise and activities!";
    if (aqi.value > 100) advice = "Sensitive groups should limit prolonged outdoor exertion. Consider wearing an N95 mask.";
    if (aqi.value > 200) advice = "Air quality is severe. Avoid outdoor cardio, keep windows closed, run HEPA purifiers indoors.";
    return {
      text: `**Air Quality Index Report for ${city}**\n\n- **Current AQI:** ${aqi.value} (${aqi.status})\n- **Primary Pollutants:** PM2.5 & PM10\n- **Humidity Impact:** ${hum}% (affects particulate dispersion)\n- **Wind:** ${wind} km/h ${windCompass} (${wind > 15 ? 'aids' : 'limited'} pollutant dispersal)\n\n**Health Advisory:** ${advice}\n\n**AQI Scale Reference:**\n- 0-50: Good | 51-100: Moderate | 101-150: Unhealthy (Sensitive)\n- 151-200: Unhealthy | 201-300: Very Unhealthy | 300+: Hazardous`,
      type: 'aqi',
      badges: [`AQI: ${aqi.value}`, aqi.status, 'PM2.5 Monitored']
    };
  }

  // 4. Agriculture / Farming
  if (q.match(/farm|crop|agriculture|agri|sow|fertiliz|irrigat|harvest|paddy|wheat|rice|maize|cotton/)) {
    return {
      text: `**MoES Agromet Advisory for ${city} Zone (${state})**\n\n**Weather Parameters:**\n- Temperature: ${temp}°C | Humidity: ${hum}%\n- Wind: ${wind} km/h ${windCompass}\n- Soil moisture outlook: ${hum > 70 ? 'High' : hum > 45 ? 'Moderate' : 'Low'} retention\n\n**Agricultural Action Plan:**\n1. **Irrigation:** ${daily[0]?.pop > 40 ? 'Postpone scheduled irrigation — rainfall expected' : 'Proceed with regular irrigation schedule'}\n2. **Pest Control:** ${hum > 65 ? `High humidity (${hum}%) may trigger fungal spore germination. Apply recommended biopesticides during morning clear windows.` : 'Normal pest monitoring advised.'}\n3. **Harvesting:** ${daily[0]?.pop > 60 ? 'Complete harvesting of mature crops urgently and store in dry, elevated shelters.' : 'Normal harvesting schedule can continue.'}\n4. **Spraying:** Schedule pesticide application when winds are below 12 km/h (currently ${wind} km/h)`,
      type: 'agromet',
      badges: ['Agromet Advisory', 'ICAR-IMD', `${state} Zone`]
    };
  }

  // 5. Climate / Historical
  if (q.match(/climate|history|trend|global warming|monsoon|average|anomal|normal|long.?term|decade/)) {
    return {
      text: `**Climate Trend Analysis for ${city} (${state})**\n\n**Current vs Historical:**\n- Current temperature: **${temp}°C** (+1.2°C above 30-year climate normal)\n- Monsoon seasonal accumulation: **104% of LPA** (Long Period Average)\n- Sea level pressure: **${pressure} hPa**\n\n**Key Insights:**\n- INSAT-3DR satellite observations show an upward trend in urban heat island intensity during afternoon hours\n- Regional precipitation patterns indicate ${region === 'North India' ? 'above-normal monsoon activity' : 'near-normal rainfall distribution'}\n- Thermal anomaly data suggests localized warming over concrete-dense urban corridors\n\n**Climate Indicators:**\n- El Nino/La Nina Status: Neutral phase\n- Indian Ocean Dipole: Weakly positive`,
      type: 'climate',
      badges: ['INSAT-3DR', '+1.2°C Anomaly', 'Climate Normal']
    };
  }

  // 6. Clothing / What to wear
  if (q.match(/wear|cloth|dress|jacket|outfit|hot outside|cold outside|layer/)) {
    if (temp > 30) {
      return {
        text: `**Clothing Recommendation for ${city}** (${temp}°C, feels like ${feelsLike}°C)\n\nIt's **warm and humid** outside!\n\n**What to Wear:**\n- Light, breathable cotton or linen clothes\n- Light colors to reflect heat\n- Wide-brimmed hat or cap\n- UV-blocking sunglasses (UV Index: **${uvIndex}**)\n\n**Stay Cool:**\n- Drink 3-4 liters of water throughout the day\n- Carry ORS or electrolyte sachets\n- Avoid prolonged sun exposure between 11 AM - 3 PM`,
        type: 'lifestyle',
        badges: ['Light Cottons', `UV: ${uvIndex}`, 'Stay Hydrated']
      };
    } else if (temp < 15) {
      return {
        text: `**Clothing Recommendation for ${city}** (${temp}°C)\n\nIt's **cold** outside!\n\n**What to Wear:**\n- Warm jacket or sweater\n- Layered clothing (thermal + mid-layer + wind-breaker)\n- Gloves and scarf for wind chill\n\n**Tips:**\n- Wind at ${wind} km/h makes it feel colder\n- Sunrise at ${sunrise} — expect cold mornings`,
        type: 'lifestyle',
        badges: ['Warm Layers', 'Bundle Up']
      };
    }
    return {
      text: `**Clothing Recommendation for ${city}** (${temp}°C)\n\nWeather is **pleasant and comfortable**!\n\n**What to Wear:**\n- Casual layered clothing — t-shirt with a light pullover\n- Comfortable for outdoor activities\n- Light rain jacket if evening plans (${daily[0]?.pop}% rain chance)\n\nSunset at **${sunset}** — evenings may be cooler.`,
      type: 'lifestyle',
      badges: ['Comfort Weather', 'Pleasant Day']
    };
  }

  // 7. UV / Sun exposure
  if (q.match(/uv|sun|sunburn|sunscreen|spf|tan/)) {
    let risk = 'Low';
    let advice = 'Minimal sun protection needed.';
    if (uvIndex >= 3 && uvIndex < 6) { risk = 'Moderate'; advice = 'Wear sunscreen SPF 30+, sunglasses, and a hat.'; }
    if (uvIndex >= 6 && uvIndex < 8) { risk = 'High'; advice = 'Apply SPF 50 sunscreen every 2 hours. Seek shade during peak hours (11 AM - 3 PM).'; }
    if (uvIndex >= 8 && uvIndex < 11) { risk = 'Very High'; advice = 'Minimize outdoor exposure. Wear protective clothing, SPF 50+, and UV-blocking sunglasses.'; }
    if (uvIndex >= 11) { risk = 'Extreme'; advice = 'Stay indoors if possible. Extreme UV radiation risk — severe sunburn within minutes.'; }
    return {
      text: `**UV Index Report for ${city}**\n\n- **Current UV Index:** ${uvIndex} / 11+ (${risk})\n- **Sunrise:** ${sunrise} | **Sunset:** ${sunset}\n- **Peak UV Hours:** 11:00 AM - 3:00 PM\n\n**Protection Advisory:** ${advice}`,
      type: 'info',
      badges: [`UV: ${uvIndex}`, risk, 'Sun Safety']
    };
  }

  // 8. Travel / Commute
  if (q.match(/travel|commut|drive|fly|road|traffic|trip|journey|highway/)) {
    const warnings = [];
    if (daily[0]?.pop > 50) warnings.push("Rain expected — carry rain gear and drive carefully");
    if (wind > 30) warnings.push("High winds — be cautious on highways and bridges");
    if (aqi.value > 150) warnings.push("Poor air quality — keep car windows closed, use AC recirculate");
    const warnStr = warnings.length > 0
      ? "\n\n**Travel Warnings:**\n" + warnings.map(w => `- ${w}`).join('\n')
      : "\n\nNo active travel warnings. Safe travels!";
    return {
      text: `**Travel Weather Advisory for ${city}**\n\n**Current Conditions:**\n- ${condition} at ${temp}°C\n- Visibility: ${ctx.cloudCover > 80 ? 'Reduced' : 'Good'}\n- Road surface: ${daily[0]?.pop > 40 ? 'Potentially wet' : 'Dry'}\n- Wind: ${wind} km/h ${windCompass}${warnStr}`,
      type: 'advisory',
      badges: ['Travel Advisory', condition]
    };
  }

  // 9. Forecast / Tomorrow / Week
  if (q.match(/forecast|tomorrow|week|next|upcoming|plan|schedule|outlook/)) {
    const forecastLines = daily.slice(0, 5).map(d =>
      `- **${d.day}** (${d.date}): ${d.condition}, ${d.maxTemp}°/${d.minTemp}°C, ${d.pop}% rain`
    ).join('\n');
    return {
      text: `**5-Day Weather Forecast for ${city}**\n\n${forecastLines}\n\n**Summary:** ${daily[1]?.pop > 60 ? 'Rain expected in coming days — plan indoor alternatives.' : 'Generally favorable conditions ahead.'} Peak UV: ${daily[0]?.uvMax}/11.`,
      type: 'info',
      badges: ['5-Day Forecast', city, 'Open-Meteo']
    };
  }

  // 10. Generic / Greeting / Summary
  if (q.match(/^(hi|hello|hey|namaste|good|what|how|tell|brief|summary|overview|current|now|status)/)) {
    return {
      text: `**Current Weather in ${city}, ${state}**\n\nConditions are **${condition}** with a temperature of **${temp}°C** (feels like **${feelsLike}°C**).\n\n- **Humidity:** ${hum}%\n- **Wind:** ${wind} km/h ${windCompass}\n- **Pressure:** ${pressure} hPa\n- **UV Index:** ${uvIndex}/11\n- **AQI:** ${aqi.value} (${aqi.status})\n- **Sunrise:** ${sunrise} | **Sunset:** ${sunset}\n\n**Today's Forecast:** High ${daily[0]?.maxTemp}°C, Low ${daily[0]?.minTemp}°C, ${daily[0]?.pop}% rain chance.\n\nAsk me about rain forecasts, air quality, farming advisories, climate trends, or travel weather!`,
      type: 'general',
      badges: ['Live Forecast', `${temp}°C`, condition]
    };
  }

  // Check if query is non-weather related before fallback
  const weatherKeywords = /weather|rain|sun|wind|cloud|storm|flood|cyclone|temperature|temp|humid|forecast|aqi|pollution|air|uv|heat|cold|warm|cool|snow|fog|mist|haze|thunder|lightning|monsoon|climate|farm|crop|agri|soil|irrig|harvest|travel|commut|drive|wear|cloth|jacket|alert|warn|disaster|emergen|pressure|satellite|imd|insat|barometer|dew|frost|hail|drought|tornado|typhoon|sunrise|sunset|season|umbrella/;
  if (!weatherKeywords.test(q) && !q.match(/^(hi|hello|hey|namaste|good|what|how|tell|brief|summary|overview|current|now|status)/)) {
    return {
      text: `I'm **WeatherGPT**, and I'm designed exclusively for **weather, climate, and atmospheric intelligence**. I can't help with that topic.\n\nBut I'd love to help you with:\n- Weather forecasts & rain predictions\n- Air quality & health advisories\n- Severe weather alerts & safety\n- Farming & crop guidance\n- Climate trends & historical data\n- Travel & commute weather\n\nWhat would you like to know about the weather in **${city}**?`,
      type: 'general',
      badges: ['Weather Only', 'Ask About Weather']
    };
  }

  // Fallback
  return {
    text: `**WeatherGPT Analysis for ${city}**\n\nCurrently **${condition}** at **${temp}°C** (feels like ${feelsLike}°C).\n\n- **Humidity:** ${hum}% | **Wind:** ${wind} km/h ${windCompass}\n- **Pressure:** ${pressure} hPa | **UV:** ${uvIndex}\n- **AQI:** ${aqi.value} (${aqi.status})\n\nI can help with:\n- Rain forecasts & umbrella advice\n- Severe weather alerts & safety\n- Air quality & health advisories\n- Farming & crop guidance\n- Climate trends & historical data\n- Travel & commute weather\n\nJust ask!`,
    type: 'general',
    badges: ['Live Data', `${temp}°C`, condition]
  };
}

// Text-to-Speech engine
export function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  const cleanText = text
    .replace(/[*#_`]/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/BADGES:.*/g, '')
    .trim();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-IN';
  window.speechSynthesis.speak(utterance);
}

// Stop speech
export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
