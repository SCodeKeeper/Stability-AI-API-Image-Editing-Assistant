# backend/app.py

# Import libraries
from flask import Flask, request, send_file, jsonify        # Flask WSGI, REST API, JSON
from flask_cors import CORS                                 # Back-end API Routing Resource Restriction (Security Measure)
import requests
import os
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

LEGACY_API_HOST = os.getenv("STABILITY_LEGACY_API_HOST")
API_KEY = os.getenv("STABILITY_API_KEY")
ENGINE_ID = os.getenv("STABILITY_API_ENGINE_ID")

if not API_KEY:
    raise EnvironmentError("Missing STABILITY_API_KEY in environment variables")

HEADERS_IMAGE = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "image/*"
}

def fetch_image_from_stability(url, headers, files_or_json):
    response = requests.post(url, headers=headers, **files_or_json)
    if response.status_code != 200:
        return None, response.text
    return BytesIO(response.content), None


@app.route("/generate", methods=["POST"])
def generate_image():
    data = request.get_json()
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    response = requests.post(
        f"{LEGACY_API_HOST}/v1/generation/{ENGINE_ID}/text-to-image",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {API_KEY}"           
        },
        json={
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            "clip_guidance_preset": "FAST_BLUE",
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        },
    )

    if response.status_code != 200:
        return jsonify({"error": response.text}), response.status_code

    data = response.json()
    image_data = data["artifacts"][0]["base64"]
    return send_file(BytesIO(base64.b64decode(image_data)), mimetype="image/png")


@app.route("/inpaint", methods=["POST"])
def inpaint_image():
    prompt = request.form.get("prompt")
    image = request.files.get("image")
    mask = request.files.get("mask")

    if not prompt or not image:
        return jsonify({"error": "Prompt and image are required"}), 400
    
    files = {
        "image": (image.filename, image.stream, image.mimetype)
    }
    
    if mask:
        files["mask"] = (mask.filename, mask.stream, mask.mimetype)
    
    response = requests.post(
        "https://api.stability.ai/v2beta/stable-image/edit/inpaint",
        headers=HEADERS_IMAGE,
        files=files,
        data={
            "prompt": prompt,
            "output_format": "png"
        },
    )

    if response.status_code != 200:
        return jsonify(response.json()), response.status_code

    return send_file(BytesIO(response.content), mimetype="image/png")


@app.route("/erase", methods=["POST"])
def erase_image():
    image = request.files.get("image")
    mask = request.files.get("mask")

    if not image:
        return jsonify({"error": "Image is required"}), 400
    
    files = {
        "image": (image.filename, image.stream, image.mimetype)
    }
    
    if mask:
        files["mask"] = (mask.filename, mask.stream, mask.mimetype)

    response = requests.post(
        "https://api.stability.ai/v2beta/stable-image/edit/erase",
        headers=HEADERS_IMAGE,
        files=files,
        data={
            "output_format": "png"
        },
    )

    if response.status_code != 200:
        return jsonify(response.json()), response.status_code

    return send_file(BytesIO(response.content), mimetype="image/png")


if __name__ == "__main__":
    app.run(debug=True)
