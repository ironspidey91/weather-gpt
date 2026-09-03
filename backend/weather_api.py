import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY", "6d73990b726322ab736ac9ee84cdaef6")
CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"


def get_weather(city):
    """
    Takes a city name, returns a dictionary with current conditions
    PLUS an hourly_rain list (rain probability % for the next ~24h,
    in 3-hour steps, from the free /forecast endpoint).
    Returns None if bad city name, no internet, etc.
    """
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }

    # 1. Current conditions
    response = requests.get(CURRENT_URL, params=params)

    if response.status_code != 200:
        print("Error fetching weather:", response.status_code, response.text)
        return None

    data = response.json()

    weather_summary = {
        "city": data["name"],
        "temperature": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "description": data["weather"][0]["description"],
        "wind_speed": data["wind"]["speed"],
    }

    # 2. Hourly-ish forecast (3-hour steps) for the rain probability chart
    forecast_response = requests.get(FORECAST_URL, params=params)

    if forecast_response.status_code == 200:
        forecast_data = forecast_response.json()
        next_slots = forecast_data["list"][:8]
        hourly_rain = [round(slot.get("pop", 0) * 100) for slot in next_slots]
        hourly_temp = [round(slot["main"]["temp"]) for slot in next_slots]
        weather_summary["hourly_rain"] = hourly_rain
        weather_summary["hourly_temp"] = hourly_temp
    else:
        print("Error fetching forecast:", forecast_response.status_code, forecast_response.text)
        weather_summary["hourly_rain"] = []
        weather_summary["hourly_temp"] = []

    return weather_summary


if __name__ == "__main__":
    city = input("Enter a city name: ")
    result = get_weather(city)

    if result:
        print("\nWeather data received:")
        for key, value in result.items():
            print(f"  {key}: {value}")
    else:
        print("Failed to get weather data.")