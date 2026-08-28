import requests

API_KEY = "6d73990b726322ab736ac9ee84cdaef6"

BASE_URL = "https://api.openweathermap.org/data/2.5/weather"


def get_weather(city):
    """
    Takes a city name, returns a simple dictionary of weather info.
    Returns None if bad city name, no internet, etc.
    """
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"  
    }

    response = requests.get(BASE_URL, params=params)

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