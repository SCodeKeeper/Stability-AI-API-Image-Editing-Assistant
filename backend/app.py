from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from io import BytesIO

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("STABILITY_API_KEY")

@app.route("/generate", methods=["POST"])
def generate_image():
    data = request.get_json()
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    response = requests.post(
        "https://api.stability.ai/v2beta/stable-image/generate/core",
        headers={
            "authorization": f"Bearer {API_KEY}",
            "accept": "image/*"
        },
        files={"none": ''},
        data={
            "prompt": prompt,
            "output_format": "webp",
        },
    )

    if response.status_code == 200:
        return send_file(BytesIO(response.content), mimetype='image/webp')
    else:
        return jsonify(response.json()), response.status_code

if __name__ == "__main__":
    app.run(debug=True)
