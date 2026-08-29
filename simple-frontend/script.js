const BACKEND_URL = "http://localhost:5000";

let currentCity = "Kolkata";
let rainChart = null;
let tempChart = null;
let lastWeather = null;

const cityInput = document.getElementById("cityInput");
const loadWeatherBtn = document.getElementById("loadWeatherBtn");
const weatherCard = document.getElementById("weatherCard");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const cityLabelEl = document.getElementById("cityLabel");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

const chatMessages = document.getElementById("chatMessages");
const questionInput = document.getElementById("questionInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function showWeather(weather) {
  weatherCard.classList.remove("hidden");
  tempEl.innerHTML = `${Math.round(weather.temperature)}&deg;`;
  descEl.textContent = weather.description;
  cityLabelEl.textContent = weather.city;
  feelsLikeEl.textContent = `${Math.round(weather.feels_like)}\u00B0C`;
  humidityEl.textContent = `${weather.humidity}%`;
  windEl.textContent = `${weather.wind_speed} m/s`;

  drawRainChart(weather.hourly_rain);
  drawTempChart(weather.hourly_temp, weather.temperature);

  // keep the city input in sync in case the city changed via chat
  cityInput.value = weather.city;
}

function drawRainChart(hourlyRain) {
  const ctx = document.getElementById("rainChart");
  const data = hourlyRain && hourlyRain.length ? hourlyRain : [];
  const labels = data.map((_, i) => `+${i * 3}h`);

  if (rainChart) {
    rainChart.data.labels = labels;
    rainChart.data.datasets[0].data = data;
    rainChart.update();
    return;
  }

  rainChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: "rgba(95, 180, 221, 0.55)",
        hoverBackgroundColor: "rgba(95, 180, 221, 0.9)",
        borderRadius: 6,
        maxBarThickness: 18
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (item) => `${item.raw}% chance` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#a9bcd6", font: { size: 10 } } },
        y: { display: false, min: 0, max: 100 }
      }
    }
  });
}

function drawTempChart(hourlyTemp, fallbackTemp) {
  const ctx = document.getElementById("tempChart");
  const data = hourlyTemp && hourlyTemp.length ? hourlyTemp : [];
  const labels = data.map((_, i) => `+${i * 3}h`);

  if (tempChart) {
    tempChart.data.labels = labels;
    tempChart.data.datasets[0].data = data;
    tempChart.update();
    return;
  }

  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        borderColor: "#f2a65a",
        backgroundColor: "rgba(242, 166, 90, 0.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: "#f2a65a"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (item) => `${item.raw}\u00B0C` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#a9bcd6", font: { size: 10 } } },
        y: { display: false }
      }
    }
  });
}

async function askBackend(city, question) {
  const response = await fetch(`${BACKEND_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city, question })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Something went wrong");
  }

  return response.json();
}

// Tries to spot a city name mentioned in the user's question
// (e.g. "will it rain in Mumbai tomorrow?" -> "Mumbai").
// Falls back to the currently loaded city if nothing is found.
function extractCityFromQuestion(question) {
  const patterns = [
    /\b(?:in|for|at|near)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

async function loadCity(city, isAuto = false) {
  const label = isAuto ? `Switching to ${city}...` : `Checking weather for ${city}...`;
  const placeholder = addMessage(label, "ai");

  try {
    const data = await askBackend(city, "give me a quick current weather summary");
    currentCity = data.weather.city;
    lastWeather = data.weather;
    showWeather(data.weather);
    placeholder.remove();
    addMessage(data.answer, "ai");
  } catch (err) {
    placeholder.remove();
    addMessage(`Error: ${err.message}`, "ai");
  }
}

loadWeatherBtn.addEventListener("click", () => {
  const city = cityInput.value.trim() || "Kolkata";
  loadCity(city);
});

sendBtn.addEventListener("click", sendQuestion);
questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendQuestion();
});

async function sendQuestion() {
  const question = questionInput.value.trim();
  if (!question) return;

  addMessage(question, "user");
  questionInput.value = "";

  const mentionedCity = extractCityFromQuestion(question);

  // If the question mentions a different city, switch to it automatically
  if (mentionedCity && mentionedCity.toLowerCase() !== currentCity.toLowerCase()) {
    await loadCityWithQuestion(mentionedCity, question);
    return;
  }

  try {
    const data = await askBackend(currentCity, question);
    lastWeather = data.weather;
    showWeather(data.weather);
    addMessage(data.answer, "ai");
  } catch (err) {
    addMessage(`Error: ${err.message}`, "ai");
  }
}

// Like loadCity, but answers the original question instead of a generic summary
async function loadCityWithQuestion(city, question) {
  try {
    const data = await askBackend(city, question);
    currentCity = data.weather.city;
    lastWeather = data.weather;
    showWeather(data.weather);
    addMessage(data.answer, "ai");
  } catch (err) {
    addMessage(`Error: ${err.message}`, "ai");
  }
}

loadCity(currentCity);