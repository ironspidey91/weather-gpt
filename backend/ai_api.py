<<<<<<< HEAD
import google.genai as genai

API_KEY = "AQ.Ab8RN6Luna606R0NgPAl9p_b7mohN2Dx3hhvTQ7ZyoPvWtKqlg"
client = genai.Client(api_key=API_KEY)

def ask(ques,weather_data):
    weather_text = {
=======
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY")
)

def ask_ai(question, weather_data):
    """
    Takes the user's question (string) and weather_data (dict from weather_api.py),
    builds a prompt, sends it to Groq's LLM, returns the plain-language answer (string).
    """

    weather_text = (
>>>>>>> 20f0845c9691ad0f7959f1700cd8591c13da6f2a
        f"City: {weather_data['city']}\n"
        f"Temperature: {weather_data['temperature']}°C\n"
        f"Feels like: {weather_data['feels_like']}°C\n"
        f"Humidity: {weather_data['humidity']}%\n"
        f"Conditions: {weather_data['description']}\n"
        f"Wind speed: {weather_data['wind_speed']} m/s"
<<<<<<< HEAD
    }

    prompt = f"""You are a helpful weather assistant for farmers and everyday people in India.
 
Here is the current weather data:
{weather_text}
 
The user asked: "{ques}"
 
Answer clearly and simply in 2-3 sentences, in plain language a non-expert would understand.
If relevant, mention any practical advice (e.g. carrying an umbrella, safety during heavy rain, etc).
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text

if __name__ == "__main__":
    # Fake sample weather data (remove the docstrings to use)
    '''
=======
    )

    prompt = f"""You are a helpful weather assistant for farmers and everyday people in India.

Here is the current weather data:
{weather_text}

The user asked: "{question}"

Answer clearly and simply in 2-3 sentences, in plain english language, or hinglish(hindi written in english) (as prompted) a non-expert would understand, dont change the language mid conversation, keep it.
If relevant, mention any practical advice (e.g. carrying an umbrella, safety during heavy rain, etc).
"""

    response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "system",
            "content": "You are MausamAI, a helpful weather assistant."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
)

    return response.choices[0].message.content


if __name__ == "__main__":
>>>>>>> 20f0845c9691ad0f7959f1700cd8591c13da6f2a
    sample_weather = {
        "city": "Kolkata",
        "temperature": 28.97,
        "feels_like": 35.97,
        "humidity": 89,
        "description": "moderate rain",
        "wind_speed": 0
<<<<<<< HEAD
    }'''
    question = input("Ask a weather question: ")
    answer = ask(question, sample_weather)
 
    print("\nAI's answer:")
    print(answer)
=======
    }

    question = input("Ask a weather question: ")
    answer = ask_ai(question, sample_weather)

    print("\nAI's answer:")
    print(answer)
>>>>>>> 20f0845c9691ad0f7959f1700cd8591c13da6f2a
