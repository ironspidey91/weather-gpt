from groq import Groq
from dotenv import load_dotenv
import os
import datetime

load_dotenv()

def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)

def ask_ai(question, weather_data):
    """
    Takes the user's question (string) and weather_data (dict from weather_api.py),
    builds a prompt, sends it to Groq's LLM, returns the plain-language answer (string).
    """
    client = get_groq_client()
    if not client:
        return (
            f"Groq API key not configured. For {weather_data.get('city', 'your area')}, "
            f"it is currently {weather_data.get('temperature', '--')}°C ({weather_data.get('description', 'clear')}) "
            f"with {weather_data.get('humidity', '--')}% humidity and {weather_data.get('wind_speed', '--')} m/s wind."
        )

    # Build rich weather context including forecast
    city = weather_data.get('city', 'Unknown')
    temp = weather_data.get('temperature', '--')
    feels = weather_data.get('feels_like', '--')
    humidity = weather_data.get('humidity', '--')
    description = weather_data.get('description', '--')
    wind = weather_data.get('wind_speed', '--')
    hourly_rain = weather_data.get('hourly_rain', [])
    hourly_temp = weather_data.get('hourly_temp', [])

    # Build time-labelled forecast (3-hour slots from now)
    now = datetime.datetime.now()
    forecast_lines = []
    for i, pop in enumerate(hourly_rain[:8]):
        slot_time = now + datetime.timedelta(hours=i * 3)
        time_label = slot_time.strftime("%-I%p").lower()  # e.g. 2pm
        temp_val = hourly_temp[i] if i < len(hourly_temp) else '--'
        forecast_lines.append(f"  {time_label}: Rain {pop}%, Temp {temp_val}°C")

    forecast_text = "\n".join(forecast_lines) if forecast_lines else "  (no forecast data available)"

    system_msg = """You are WeatherGPT — a friendly, knowledgeable AI assistant built for India's Ministry of Earth Sciences (MoES) under Smart India Hackathon (SIH26068).

Personality: You are warm, conversational, witty, and approachable. Talk like a smart, helpful friend — not a rigid robot. Use natural language, vary your tone, and show personality. Be casual and fun.

Core expertise: Weather, climate, atmospheric science, AQI, agricultural advisories, severe alerts, travel weather, lifestyle tips, and general knowledge.

Rules:
- You can answer ANY question, weather or not.
- NEVER just repeat the current conditions verbatim as your entire answer.
- For future weather questions (tomorrow, tonight, at 3pm, etc.), ALWAYS use the hourly forecast data provided. Reference specific time slots and rain percentages.
- Use markdown: **bold** for key data, bullet points for lists.
- Keep answers 80-220 words. Be specific, not vague."""

    user_msg = f"""CURRENT WEATHER — {city}:
Temperature: {temp}°C (feels like {feels}°C)
Humidity: {humidity}%
Conditions: {description}
Wind: {wind} m/s

NEXT 24H FORECAST (3-hour slots):
{forecast_text}

USER'S QUESTION: "{question}"

Respond helpfully using the forecast data above when relevant. Don't just copy the current conditions. Reason about it."""

    models_to_try = [
        os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-70b-8192",
        "llama3-8b-8192",
    ]

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user",   "content": user_msg}
                ],
                temperature=0.75,
                max_tokens=600,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error with model {model_name}: {e}")
            continue

    # Only reach here if ALL models fail
    if hourly_rain:
        max_pop = max(hourly_rain)
        return (
            f"Right now in {city} it's **{temp}°C** ({description}). "
            f"Over the next 24 hours, rain probability peaks at **{max_pop}%**. "
            f"{'Carry an umbrella to be safe!' if max_pop > 40 else 'Rain is unlikely today.'}"
        )
    return (
        f"Currently in {city}: **{temp}°C** ({description}), humidity {humidity}%, wind {wind} m/s."
    )


if __name__ == "__main__":
    sample_weather = {
        "city": "Kolkata",
        "temperature": 30,
        "feels_like": 35,
        "humidity": 81,
        "description": "Partly Cloudy",
        "wind_speed": 7,
        "hourly_rain": [10, 20, 45, 70, 60, 30, 15, 10],
        "hourly_temp": [30, 31, 31, 30, 29, 28, 28, 29],
    }

    question = input("Ask a weather question: ")
    answer = ask_ai(question, sample_weather)

    print("\nAI's answer:")
    print(answer)

#https://weather-gpt-backend.onrender.com