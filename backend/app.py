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
    data = request.get_json()

    city = data.get("city")
    question = data.get("question")

    if not city or not question:
        return jsonify({"error": "Please provide both city and question"}), 400

    weather_data = get_weather(city)

    if weather_data is None:
        return jsonify({"error": "Could not fetch weather for that city"}), 500

    answer = ask_ai(question, weather_data)

    return jsonify({
        "answer": answer,
        "weather": weather_data
    })


@app.route("/")
def home():
    return "MausamAI backend is running!"


if __name__ == "__main__":
    app.run(debug=True, port=5000)
