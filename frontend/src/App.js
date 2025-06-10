import React, { useState } from "react";

export default function App() {
  // State for generation
  const [prompt, setPrompt] = useState("");
  const [generatedImgUrl, setGeneratedImgUrl] = useState(null);

  // State for Inpaint
  const [inpaintImageFile, setInpaintImageFile] = useState(null);
  const [inpaintMaskFile, setInpaintMaskFile] = useState(null);
  const [inpaintImgUrl, setInpaintImgUrl] = useState(null);

  // State for Erase
  const [eraseImageFile, setEraseImageFile] = useState(null);
  const [eraseMaskFile, setEraseMaskFile] = useState(null);
  const [eraseImgUrl, setEraseImgUrl] = useState(null);

  // Handle text input change
  function handlePromptChange(e) {
    setPrompt(e.target.value);
  }

  // Handle file input change (need to know which field)
  function handleFileChange(e, target) {
    const file = e.target.files[0];
    if (!file) return;

    switch (target) {
      case "inpaintImage":
        setInpaintImageFile(file);
        break;
      case "inpaintMask":
        setInpaintMaskFile(file);
        break;
      case "eraseImage":
        setEraseImageFile(file);
        break;
      case "eraseMask":
        setEraseMaskFile(file);
        break;
      default:
        break;
    }
  }

  // Generic clear function per section
  function clearSection(section) {
    switch (section) {
      case "generate":
        setPrompt("");
        setGeneratedImgUrl(null);
        break;
      case "inpaint":
        setInpaintImageFile(null);
        setInpaintMaskFile(null);
        setInpaintImgUrl(null);
        break;
      case "erase":
        setEraseImageFile(null);
        setEraseMaskFile(null);
        setEraseImgUrl(null);
        break;
      default:
        break;
    }
  }

  // Handle button clicks: generate, inpaint, erase
  async function handleAction(action) {
    if (action === "generate") {
      if (!prompt) {
        alert("Please enter a prompt.");
        return;
      }

      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        alert("Error generating image");
        return;
      }
      const blob = await res.blob();
      setGeneratedImgUrl(URL.createObjectURL(blob));
    }

    else if (action === "inpaint") {
      if (!inpaintImageFile || !inpaintMaskFile) {
        alert("Please upload both image and inpaint mask.");
        return;
      }
      const formData = new FormData();
      formData.append("image", inpaintImageFile);
      formData.append("mask", inpaintMaskFile);
      formData.append("prompt", prompt || ""); // Optional prompt for inpaint

      const res = await fetch("http://localhost:5000/inpaint", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        alert("Error inpainting image");
        return;
      }
      const blob = await res.blob();
      setInpaintImgUrl(URL.createObjectURL(blob));
    }

    else if (action === "erase") {
      if (!eraseImageFile || !eraseMaskFile) {
        alert("Please upload both image and erase mask.");
        return;
      }
      const formData = new FormData();
      formData.append("image", eraseImageFile);
      formData.append("mask", eraseMaskFile);

      const res = await fetch("http://localhost:5000/erase", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        alert("Error erasing image");
        return;
      }
      const blob = await res.blob();
      setEraseImgUrl(URL.createObjectURL(blob));
    }
  }

  return (
    <div className="App" style={{ padding: "20px", maxWidth: 600, margin: "auto" }}>
      <h1>Stability AI Image Editor</h1>

      {/* Generate Section */}
      <section>
        <h2>SD 1.6 Image Generation</h2>
        <input
          type="text"
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Enter prompt..."
          style={{ width: "100%", marginBottom: 10 }}
        />
        <div>
          <button onClick={() => handleAction("generate")}>Generate Image</button>
          <button onClick={() => clearSection("generate")} style={{ marginLeft: 10 }}>
            Clear
          </button>
        </div>
        {generatedImgUrl && (
          <img
            src={generatedImgUrl}
            alt="Generated"
            style={{ marginTop: 10, maxWidth: "100%" }}
          />
        )}
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Inpaint Section */}
      <section>
        <h2>Inpaint</h2>
        <p>Upload Image</p>
        <input
          type="file"
          accept="image/png"
          onChange={(e) => handleFileChange(e, "inpaintImage")}
          className="file-input"
        />
        <p>Upload Inpaint Mask</p>
        <input
          type="file"
          accept="image/png"
          onChange={(e) => handleFileChange(e, "inpaintMask")}
          className="file-input"
        />
        <div style={{ marginTop: 10 }}>
          <button onClick={() => handleAction("inpaint")} disabled={!inpaintImageFile || !inpaintMaskFile}>
            Inpaint
          </button>
          <button onClick={() => clearSection("inpaint")} disabled={!inpaintImgUrl} style={{ marginLeft: 10 }}>
            Clear
          </button>
        </div>
        {inpaintImgUrl && (
          <img
            src={inpaintImgUrl}
            alt="Inpainted"
            style={{ marginTop: 10, maxWidth: "100%" }}
          />
        )}
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Erase Section */}
      <section>
        <h2>Erase</h2>
        <p>Upload Image</p>
        <input
          type="file"
          accept="image/png"
          onChange={(e) => handleFileChange(e, "eraseImage")}
          className="file-input"
        />
        <p>Upload Erase Mask</p>
        <input
          type="file"
          accept="image/png"
          onChange={(e) => handleFileChange(e, "eraseMask")}
          className="file-input"
        />
        <div style={{ marginTop: 10 }}>
          <button onClick={() => handleAction("erase")} disabled={!eraseImageFile || !eraseMaskFile}>
            Erase
          </button>
          <button onClick={() => clearSection("erase")} disabled={!eraseImgUrl} style={{ marginLeft: 10 }}>
            Clear
          </button>
        </div>
        {eraseImgUrl && (
          <img
            src={eraseImgUrl}
            alt="Erased"
            style={{ marginTop: 10, maxWidth: "100%" }}
          />
        )}
      </section>
    </div>
  );
}
