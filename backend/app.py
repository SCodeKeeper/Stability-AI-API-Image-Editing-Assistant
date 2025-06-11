# backend/app.py

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import requests
import os
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

STABILITY_API_HOST = "https://api.stability.ai"
API_KEY = os.getenv("STABILITY_API_KEY")

if not API_KEY:
    raise EnvironmentError("Missing STABILITY_API_KEY in environment variables")


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
        f"{STABILITY_API_HOST}/v1/generation/stable-diffusion-512-v2-1/text-to-image",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            "clip_guidance_preset": "FAST_BLUE",
            "height": 512,
            "width": 512,
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
def inpaint():
    prompt = request.form.get("prompt")
    image = request.files.get("image")
    mask = request.files.get("mask")

    if not prompt or not image:
        return jsonify({"error": "Prompt and image are required"}), 400

    files = {
        "init_image": (image.filename, image.stream, image.mimetype),
        "mask_image": (mask.filename, mask.stream, mask.mimetype) if mask else None
    }

    # Clean up None entries from files
    files = {k: v for k, v in files.items() if v is not None}

    headers = {"Authorization": f"Bearer {API_KEY}"}

    image_data, error = fetch_image_from_stability(
        f"{STABILITY_API_HOST}/v1/generation/stable-diffusion-512-inpainting/image-to-image",
        headers,
        {
            "files": files,
            "data": {
                "text_prompts": prompt,
                "cfg_scale": 7,
                "samples": 1,
                "steps": 30
            },
        }
    )

    if error:
        return jsonify({"error": error}), 500

    return send_file(image_data, mimetype="image/png")


@app.route("/erase", methods=["POST"])
def erase():
    image = request.files.get("image")
    mask = request.files.get("mask")

    if not image or not mask:
        return jsonify({"error": "Image and mask are required"}), 400

    files = {
        "image": (image.filename, image.stream, image.mimetype),
        "mask": (mask.filename, mask.stream, mask.mimetype)
    }

    headers = {"Authorization": f"Bearer {API_KEY}"}

    image_data, error = fetch_image_from_stability(
        f"{STABILITY_API_HOST}/v1/erase",
        headers,
        {"files": files}
    )

    if error:
        return jsonify({"error": error}), 500

    return send_file(image_data, mimetype="image/png")


if __name__ == "__main__":
    app.run(debug=True)
