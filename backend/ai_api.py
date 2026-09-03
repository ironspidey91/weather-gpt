from groq import Groq
from dotenv import load_dotenv
import os

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

    weather_text = (
        f"City: {weather_data.get('city', 'Unknown')}\n"
        f"Temperature: {weather_data.get('temperature', '--')}°C\n"
        f"Feels like: {weather_data.get('feels_like', '--')}°C\n"
        f"Humidity: {weather_data.get('humidity', '--')}%\n"
        f"Conditions: {weather_data.get('description', '--')}\n"
        f"Wind speed: {weather_data.get('wind_speed', '--')} m/s"
    )

    prompt = f"""You are WeatherGPT — a friendly, knowledgeable AI assistant built for India's Ministry of Earth Sciences (MoES) under Smart India Hackathon (SIH26068).

Personality: You are warm, conversational, witty, and approachable. Talk like a smart, helpful friend — not a rigid robot. Use natural language, vary your tone, and show personality. Be casual and fun.

Core expertise: Weather, climate, atmospheric science, AQI, agricultural advisories, severe alerts, travel weather, lifestyle tips, and general knowledge.

Conversation guidelines:
- You can answer ANY question — weather or not. You're a smart AI, not just a weather bot.
- For non-weather topics, answer helpfully and naturally. If it fits, casually tie in the current weather context (e.g. "Great question! Also, it's {weather_data.get('temperature', '--')}°C outside, perfect for...")
- For weather topics, use real data from the context provided below. Be specific with numbers.
- If asked about future weather (like rain tomorrow or at a specific time) and the data below only shows current weather, give your best general meteorological advice or admit you only have current live data, rather than just repeating current weather unhelpfully.
- Keep responses concise (100-250 words) unless detail is needed.
- Use markdown: **bold** for key data, bullet points for lists.

CURRENT WEATHER CONTEXT:
{weather_text}

USER'S QUESTION: "{question}"
"""

    models_to_try = [
        os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "llama3-70b-8192",
    ]

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are WeatherGPT, a helpful weather assistant."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error with model {model_name}: {e}")
            continue

    return (
        f"Currently in {weather_data.get('city', 'your area')}, the temperature is {weather_data.get('temperature', '--')}°C "
        f"({weather_data.get('description', '--')}) with {weather_data.get('humidity', '--')}% humidity and {weather_data.get('wind_speed', '--')} m/s wind."
    )


if __name__ == "__main__":
    sample_weather = {
        "city": "Kolkata",
        "temperature": 28.97,
        "feels_like": 35.97,
        "humidity": 89,
        "description": "moderate rain",
        "wind_speed": 0
    }

    question = input("Ask a weather question: ")
    answer = ask_ai(question, sample_weather)

    print("\nAI's answer:")
    print(answer)

#https://weather-gpt-backend.onrender.com