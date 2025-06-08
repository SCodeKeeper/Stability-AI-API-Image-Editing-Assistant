# app.py
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import base64
from io import BytesIO
from PIL import Image

# Load environment variables
load_dotenv()

# Flask setup
app = Flask(__name__)
CORS(app)

# Stability API setup
API_KEY = os.getenv("STABILITY_API_KEY")
API_HOST = os.getenv('API_HOST', 'https://api.stability.ai')
ENGINE_ID = "stable-diffusion-v1-6"


@app.route("/generate", methods=["POST"])
def generate_image():
    prompt = request.form.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    if API_KEY is None:
        return jsonify({"error": "Missing API key"}), 400

    response = requests.post(
        f"{API_HOST}/v1/generation/{ENGINE_ID}/text-to-image",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        },
        json={
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 30,
            "height": 512,
            "width": 512,
            "samples": 1,
            "steps": 30
        }
    )

    if response.status_code != 200:
        return jsonify({"error": response.text}), response.status_code

    image_base64 = response.json()["artifacts"][0]["base64"]
    image_bytes = base64.b64decode(image_base64)
    return send_file(BytesIO(image_bytes), mimetype="image/png")


@app.route("/erase", methods=["POST"])
def erase_image():
    image_file = request.files.get("image")
    prompt = request.form.get("prompt", "")

    if not image_file:
        return jsonify({"error": "No image provided"}), 400
    if API_KEY is None:
        return jsonify({"error": "Missing API key"}), 400

    # Create a dummy white mask (erase everything)
    image = Image.open(image_file).convert("RGB")
    mask = Image.new("RGB", image.size, (255, 255, 255))

    img_io = BytesIO()
    mask_io = BytesIO()
    image.save(img_io, "PNG")
    mask.save(mask_io, "PNG")
    img_io.seek(0)
    mask_io.seek(0)

    response = requests.post(
        f"{API_HOST}/v2beta/stable-image/edit/erase",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Accept": "image/*"
        },
        files={
            "image": ("image.png", img_io, "image/png"),
            "mask": ("mask.png", mask_io, "image/png"),
        },
        data={
            "output_format": "png"
        }
    )

    if response.status_code != 200:
        return jsonify({"error": response.text}), response.status_code

    return send_file(BytesIO(response.content), mimetype="image/png")


@app.route("/inpaint", methods=["POST"])
def inpaint_image():
    image_file = request.files.get("image")
    prompt = request.form.get("prompt", "")

    if not image_file or not prompt:
        return jsonify({"error": "Image and prompt required"}), 400
    if API_KEY is None:
        return jsonify({"error": "Missing API key"}), 400

    # Dummy mask — in real app, you'd use user input or segmentation
    image = Image.open(image_file).convert("RGB")
    mask = Image.new("RGB", image.size, (255, 255, 255))  # mask everything

    img_io = BytesIO()
    mask_io = BytesIO()
    image.save(img_io, "PNG")
    mask.save(mask_io, "PNG")
    img_io.seek(0)
    mask_io.seek(0)

    response = requests.post(
        f"{API_HOST}/v2beta/stable-image/edit/inpaint",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Accept": "image/*"
        },
        files={
            "image": ("image.png", img_io, "image/png"),
            "mask": ("mask.png", mask_io, "image/png"),
        },
        data={
            "prompt": prompt,
            "output_format": "png"
        }
    )

    if response.status_code != 200:
        return jsonify({"error": response.text}), response.status_code

    return send_file(BytesIO(response.content), mimetype="image/png")


# Run the app
if __name__ == "__main__":
    app.run(debug=True)
