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

    prompt = f"""You are a helpful weather assistant for farmers and everyday people in India.

Here is the current weather data:
{weather_text}

The user asked: "{question}"

Answer clearly and simply in 2-3 sentences, in plain english language, or hinglish(hindi written in english) (as prompted) a non-expert would understand, dont change the language mid conversation, keep it.
If relevant, mention any practical advice (e.g. carrying an umbrella, safety during heavy rain, etc).
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

