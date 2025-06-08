from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from io import BytesIO
import base64

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("STABILITY_API_KEY")
API_HOST = os.getenv('API_HOST', 'https://api.stability.ai')
ENGINE_ID = "stable-diffusion-v1-6"

@app.route("/generate", methods=["POST"])
def generate_image():
    data = request.get_json()
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    response = requests.post(
        f"{API_HOST}/v1/generation/{ENGINE_ID}/text-to-image",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        },
        json={
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        }
    )

    if response.status_code != 200:
        return jsonify({"error": response.text}), response.status_code

    result = response.json()
    image_base64 = result["artifacts"][0]["base64"]
    image_bytes = base64.b64decode(image_base64)
    return send_file(BytesIO(image_bytes), mimetype="image/png")

if __name__ == "__main__":
    app.run(debug=True)
