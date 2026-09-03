from flask import Flask, request, jsonify
from flask_cors import CORS

from weather_api import get_weather
from ai_api import ask_ai

app = Flask(__name__)
CORS(app)  # allows the frontend (running on a different port) to call this backend


@app.route("/ask", methods=["POST"])
def ask():
    """
    Frontend sends: { "city": "Kolkata", "question": "will it rain tomorrow?" }
    We send back:   { "answer": "..." }
    """
    data = request.get_json() or {}
    city = data.get("city")
    question = data.get("question")
    weather_data = data.get("weather") or data.get("weather_data")

    if not question:
        return jsonify({"error": "Please provide a question"}), 400

    if not weather_data:
        if not city:
            return jsonify({"error": "Please provide either city or weather data"}), 400
        weather_data = get_weather(city)

    if weather_data is None:
        return jsonify({"error": "Could not fetch weather for that city"}), 500

    # Ensure required fields exist in weather_data
    if "feels_like" not in weather_data and "feelsLike" in weather_data:
        weather_data["feels_like"] = weather_data["feelsLike"]
    if "wind_speed" not in weather_data and "windSpeed" in weather_data:
        weather_data["wind_speed"] = weather_data["windSpeed"]
    if "description" not in weather_data and "condition" in weather_data:
        weather_data["description"] = weather_data["condition"]

    answer = ask_ai(question, weather_data)

    return jsonify({
        "answer": answer,
        "weather": weather_data
    })


@app.route("/")
def home():
    return "WeatherGPT backend is running!"


if __name__ == "__main__":
    app.run(debug=True, port=5000)
