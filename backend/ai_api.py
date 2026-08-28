from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def ask(ques,weather_data):
    weather_text = (
        f"City: {weather_data['city']}\n"
        f"Temperature: {weather_data['temperature']}°C\n"
        f"Feels like: {weather_data['feels_like']}°C\n"
        f"Humidity: {weather_data['humidity']}%\n"
        f"Conditions: {weather_data['description']}\n"
        f"Wind speed: {weather_data['wind_speed']} m/s"
    )

    prompt = f"""You are a helpful weather assistant for farmers and everyday people in India.
 
Here is the current weather data:
{weather_text}
 
The user asked: "{ques}"
 
Answer clearly and simply in 2-3 sentences, in plain language a non-expert would understand.
If relevant, mention any practical advice (e.g. carrying an umbrella, safety during heavy rain, etc).
"""

    response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "system",
            "content": "You are WeatherGPT, a helpful weather assistant."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
)

    return response.choices[0].message.content

if __name__ == "__main__":
    # Fake sample weather data (remove the docstrings to use)
    
    sample_weather = {
        "city": "Kolkata",
        "temperature": 28.97,
        "feels_like": 35.97,
        "humidity": 89,
        "description": "moderate rain",
        "wind_speed": 0
    }
    question = input("Ask a weather question: ")
    answer = ask(question, sample_weather)
 
    print("\nAI's answer:")
    print(answer)