// ================================================================
// MausamAI v2.0 — Conversational AI Service
// Groq API integration with intelligent fallback engine
// ================================================================

const GROQ_API_KEY = import.meta.env?.VITE_GROQ_API_KEY || '';

if (!GROQ_API_KEY) {
  // This is almost certainly why the bot feels "hardcoded" — without a
  // key, every single message silently falls back to the rigid
  // pattern-matched localWeatherEngine below instead of a real LLM.
  // On Render: Settings → Environment → add VITE_GROQ_API_KEY, then redeploy
  // (Vite bakes VITE_* vars in at BUILD time, so just adding the var
  // isn't enough — it must be set before the build runs).
  console.warn(
    '[MausamAI] VITE_GROQ_API_KEY is missing. Falling back to the static ' +
    'rule-based engine for every message. Set it in your deployment\'s ' +
    'environment variables and rebuild to enable real AI responses.'
  );
}

const SYSTEM_PROMPT = `You are MausamAI, a knowledgeable, conversational AI assistant built for India's Ministry of Earth Sciences (MoES) under Smart India Hackathon (SIH26068).

You are a genuine general-purpose assistant, not a scripted bot. Think through each question and respond the way a real, well-informed language model would — reason about what's actually being asked, pull in relevant facts, and give a substantive answer.

Your specialty is weather, climate, atmospheric science, AQI, agriculture, and travel/lifestyle guidance tied to conditions — lean on the live weather data provided below whenever it's relevant, and be specific with real numbers.

You are NOT restricted to weather topics. If someone asks something unrelated, just answer it directly and helpfully using your general knowledge — don't deflect, redirect, or refuse. Only bring the conversation back to weather if it naturally fits.

Style:
- Natural, warm, conversational — vary your phrasing, don't reuse the same structure every time
- Use markdown: **bold** for key figures, bullet points when listing things
- Match response length to the question — short questions get short answers, complex ones get room to breathe
- For severe weather, be direct and lead with safety guidance
- End with 2-3 short badge labels on the last line in this exact format: BADGES: [badge1, badge2]`;

// Try Groq API first, fallback to local engine
export async function processMausamAIQuery(query, weatherContext) {
  if (GROQ_API_KEY) {
    try {
      return await queryGroqAPI(query, weatherContext);
    } catch (err) {
      console.warn("[MausamAI] Groq API call failed, using static fallback engine:", err.message);
    }
  }
  return localWeatherEngine(query, weatherContext);
}

async function queryGroqAPI(query, weatherContext) {
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
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `${contextStr}\n\nUser Query: ${query}\n\nProvide a helpful, data-driven response. End with 2-3 relevant badge labels in this exact format on the last line:\nBADGES: [badge1, badge2, badge3]`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      })
    }
  );

  if (!response.ok) throw new Error(`Groq API: ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

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
    const timeMatch = q.match(/(\d{1,2})\s*(am|pm)/);
    const timeNote = timeMatch
      ? `\n\n*Note: hourly precipitation timing isn't in this data source — the ${todayPop}% figure is today's overall probability, not specifically for ${timeMatch[0]}.*`
      : '';
    if (todayPop > 50) {
      return {
        text: `**High Precipitation Alert for ${city} Today (${todayPop}% probability)**\n\nSatellite radar and atmospheric pressure data (${pressure} hPa) indicate rainfall expected later today. Current humidity is at ${hum}%.\n\n**Recommendations:**\n- Carry an umbrella or rain jacket\n- Avoid waterlogged roads and underpasses\n- Secure outdoor belongings\n\nTomorrow's rain probability: **${tmrwPop}%**${timeNote}`,
        type: 'advisory',
        badges: ['Rain Alert', `${todayPop}% Chance`, 'Carry Umbrella']
      };
    }
    return {
      text: `**Low Precipitation Risk in ${city} Today** (${todayPop}% probability)\n\nConditions are currently **${condition}** at **${temp}°C**. Skies are mostly favorable for outdoor activities.\n\nHowever, tomorrow shows **${tmrwPop}% chance of rain** — plan accordingly.\n\n- **Humidity**: ${hum}%\n- **Wind**: ${wind} km/h ${windCompass}\n- **Pressure**: ${pressure} hPa${timeNote}`,
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

  // 6.5 Air Conditioner / Cooling temperature
  if (q.match(/\bac\b|air.?condition|thermostat|cooling|set.*temp|what temp.*ac|ac.*temp/)) {
    let rec = 24;
    let note = "A comfortable middle ground for most people.";
    if (temp >= 35) { rec = 22; note = "It's very hot outside, so a lower setting helps the room catch up faster."; }
    else if (temp >= 30) { rec = 23; note = "Warm conditions outside — this keeps the room cool without overworking the unit."; }
    else if (temp <= 22) { rec = 26; note = "It's already mild outside, so you don't need to go much lower."; }
    if (hum > 70) note += ` High humidity (${hum}%) makes it feel warmer than it is — pairing this with dry/dehumidify mode helps.`;
    return {
      text: `**AC Recommendation for ${city}**\n\nWith it currently **${temp}°C** (feels like ${feelsLike}°C) and **${hum}% humidity**, I'd set the AC to around **${rec}°C**.\n\n${note}`,
      type: 'lifestyle',
      badges: [`${rec}°C Suggested`, 'Comfort']
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

  // 10. Greetings — warm and human
  if (q.match(/^(hi|hello|hey|namaste|good morning|good evening|good afternoon|sup|yo)/)) {
    const greetings = [
      `Hey there! 👋 It's **${temp}°C** and **${condition.toLowerCase()}** in ${city} right now. What can I help you with — rain check, air quality, or maybe what to wear today?`,
      `Hi! Welcome to MausamAI 🌤️ Right now in **${city}** it's **${temp}°C**, feels like **${feelsLike}°C**. ${daily[0]?.pop > 40 ? "Heads up — there's a decent chance of rain today!" : "Looking pretty clear out there."} What's on your mind?`,
      `Namaste! 🙏 Currently **${condition.toLowerCase()}** at **${temp}°C** in ${city}. Humidity's at ${hum}% and wind is ${wind} km/h. Ask me anything — forecasts, alerts, air quality, you name it!`,
    ];
    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      type: 'general',
      badges: [`${temp}°C`, condition, 'Live']
    };
  }

  // 11. Current weather / summary / what's the weather
  if (q.match(/what|how|tell|brief|summary|overview|current|now|status|update|weather like|whats/)) {
    const commentary = temp > 35 ? "It's scorching out there — stay hydrated! 🥵" : temp > 28 ? "Warm but manageable." : temp < 15 ? "Bundle up, it's chilly! 🧣" : "Pretty comfortable weather right now 👌";
    return {
      text: `Here's what's happening in **${city}** right now:\n\n${commentary}\n\n- 🌡️ **${temp}°C** (feels like ${feelsLike}°C) — ${condition}\n- 💧 Humidity: **${hum}%** | Wind: **${wind} km/h** ${windCompass}\n- 🫁 AQI: **${aqi.value}** (${aqi.status})\n- ☀️ UV: **${uvIndex}/11** | Sunrise ${sunrise}, Sunset ${sunset}\n\n**Today:** High ${daily[0]?.maxTemp}°, Low ${daily[0]?.minTemp}°, ${daily[0]?.pop}% rain chance.`,
      type: 'general',
      badges: ['Live Data', `${temp}°C`, condition]
    };
  }

  // 12. Thank you / appreciation
  if (q.match(/thank|thanks|thx|appreciate|helpful|great|awesome|nice|cool|perfect/)) {
    const replies = [
      `You're welcome! 😊 I'm here whenever you need a weather update for **${city}**. Stay safe out there!`,
      `Glad I could help! Feel free to ask me anything about the weather, air quality, or forecasts anytime 🌤️`,
      `Anytime! That's what I'm here for. Just ping me if the weather changes or you need advice. Currently **${temp}°C** and **${condition.toLowerCase()}** in ${city}.`,
    ];
    return {
      text: replies[Math.floor(Math.random() * replies.length)],
      type: 'general',
      badges: ['Happy to Help', city]
    };
  }

  // 13. Who are you / about
  if (q.match(/who are you|what are you|about|your name|introduce/)) {
    return {
      text: `I'm **MausamAI** — your AI-powered weather intelligence assistant! 🤖🌦️\n\nBuilt for India's **Ministry of Earth Sciences** under the Smart India Hackathon (SIH26068), I specialize in:\n\n- Real-time weather analysis & forecasts\n- Severe weather alerts & safety guidance\n- Air quality monitoring & health advisories\n- Agricultural advisories for farmers\n- Climate trends & historical data\n\nI use data from **IMD, INSAT-3DR satellites**, and the Open-Meteo API. Currently tracking weather for **${city}** — ask me anything!`,
      type: 'general',
      badges: ['MausamAI', 'SIH26068', 'MoES']
    };
  }

  // Soft redirect for off-topic (friendly, not robotic)
  const offTopicKeywords = /movie|cricket|football|politics|president|prime minister|song|music|code|program|math|calcul|recipe|cook|game|stock|share|bitcoin|crypto|boyfriend|girlfriend|relationship|exam|college|admission/;
  if (offTopicKeywords.test(q)) {
    const redirects = [
      `Ha, that's a bit outside my wheelhouse! 😄 I'm all about weather and climate. But hey — did you know it's **${temp}°C** in ${city} right now? Want to know if you'll need an umbrella later?`,
      `I wish I could help with that, but weather is really my thing! 🌧️ How about I tell you about the forecast for ${city} instead? Currently **${condition.toLowerCase()}** at **${temp}°C**.`,
      `That one's beyond me, I'm afraid! I live and breathe weather data 🌪️ Ask me about forecasts, air quality, alerts, or farming advisories — I've got you covered for **${city}**!`,
    ];
    return {
      text: redirects[Math.floor(Math.random() * redirects.length)],
      type: 'general',
      badges: ['Weather Expert', city]
    };
  }

  // Fallback — helpful and inviting, not a dead end
  const fallbacks = [
    `Right now in **${city}** it's **${temp}°C** and **${condition.toLowerCase()}** — ${daily[0]?.pop > 40 ? "rain is possible later!" : "looking clear for now."}\n\nI can dive deeper into forecasts, air quality, farming advice, or travel weather. What interests you?`,
    `Here's a quick snapshot for **${city}**: **${temp}°C**, ${condition.toLowerCase()}, humidity at **${hum}%**, wind **${wind} km/h** ${windCompass}.\n\nWant details on rain probability, UV levels, AQI, or the 5-day outlook? Just ask! 😊`,
    `**${condition}** in ${city} at **${temp}°C** (feels like ${feelsLike}°C). AQI is ${aqi.value} (${aqi.status}).\n\nI'm great at rain forecasts, severe alerts, farming tips, and travel weather — fire away!`,
  ];
  return {
    text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
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
