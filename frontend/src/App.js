// frontend/src/app.js

import React, { useState } from "react";

export default function App() {
  /*--------------------States--------------------*/
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generatedImgUrl, setGeneratedImgUrl] = useState(null);

  const [inpaintPrompt, setInpaintPrompt] = useState("");
  const [inpaintImageFile, setInpaintImageFile] = useState(null);
  const [inpaintMaskFile, setInpaintMaskFile] = useState(null);
  const [inpaintImgUrl, setInpaintImgUrl] = useState(null);

  const [eraseImageFile, setEraseImageFile] = useState(null);
  const [eraseMaskFile, setEraseMaskFile] = useState(null);
  const [eraseImgUrl, setEraseImgUrl] = useState(null);

  /*--------------------File Change Handler--------------------*/
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

  /*--------------------Clear Section--------------------*/
  function clearSection(section) {
    switch (section) {
      case "generate":
        setGeneratePrompt("");
        setGeneratedImgUrl(null);
        break;
      case "inpaint":
        setInpaintPrompt("");
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

  /*--------------------Handle Actions--------------------*/
  async function handleAction(action) {
    try {
      if (action === "generate") {
        if (!generatePrompt) return alert("Enter a prompt");

        const res = await fetch("http://localhost:5000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: generatePrompt }),
        });

        const blob = await res.blob();
        setGeneratedImgUrl(URL.createObjectURL(blob));
      }

      else if (action === "inpaint") {
        if (!inpaintPrompt || !inpaintImageFile) {
          return alert("Provide both prompt and image for inpainting");
        }

        const formData = new FormData();
        formData.append("prompt", inpaintPrompt);
        formData.append("image", inpaintImageFile);
        if (inpaintMaskFile) formData.append("mask", inpaintMaskFile);

        const res = await fetch("http://localhost:5000/inpaint", {
          method: "POST",
          body: formData,
        });

        const blob = await res.blob();
        setInpaintImgUrl(URL.createObjectURL(blob));
      }

      else if (action === "erase") {
        if (!eraseImageFile) {
          return alert("Provide image for erase");
        }

        const formData = new FormData();
        formData.append("image", eraseImageFile);
        if (eraseMaskFile) formData.append("mask", eraseMaskFile);

        const res = await fetch("http://localhost:5000/erase", {
          method: "POST",
          body: formData,
        });

        const blob = await res.blob();
        setEraseImgUrl(URL.createObjectURL(blob));
      }

    } catch (error) {
      console.error("Error during request:", error);
      alert("Something went wrong. See console for details.");
    }
  }

  /*--------------------Render--------------------*/
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1>Stability AI Image Editor</h1>

      {/* Generate Section */}
      <section>
        <h2>Generate Image (SDXL 1.0)</h2>
        <input
          type="text"
          value={generatePrompt}
          onChange={(e) => setGeneratePrompt(e.target.value)}
          placeholder="Prompt"
          style={{ width: "100%", marginBottom: 10 }}
        />
        <div>
          <button onClick={() => handleAction("generate")}>Generate</button>
          <button onClick={() => clearSection("generate")} style={{ marginLeft: 10 }}>
            Clear
          </button>
        </div>
        {generatedImgUrl && <img src={generatedImgUrl} alt="Generated" style={{ marginTop: 10, maxWidth: "100%" }} />}
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Inpaint Section */}
      <section>
        <h2>Inpaint</h2>
        <input
          type="text"
          value={inpaintPrompt}
          onChange={(e) => setInpaintPrompt(e.target.value)}
          placeholder="Prompt"
          style={{ width: "100%", marginBottom: 10 }}
        />
        <p>Upload Image</p>
        <input type="file" accept="image/png" onChange={(e) => handleFileChange(e, "inpaintImage")} />
        <p>Upload Mask (optional)</p>
        <input type="file" accept="image/png" onChange={(e) => handleFileChange(e, "inpaintMask")} />
        <div style={{ marginTop: 10 }}>
          <button onClick={() => handleAction("inpaint")} disabled={!inpaintPrompt || !inpaintImageFile}>
            Inpaint
          </button>
          <button onClick={() => clearSection("inpaint")} disabled={!inpaintImgUrl} style={{ marginLeft: 10 }}>
            Clear
          </button>
        </div>
        {inpaintImgUrl && <img src={inpaintImgUrl} alt="Inpainted" style={{ marginTop: 10, maxWidth: "100%" }} />}
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Erase Section */}
      <section>
        <h2>Erase</h2>
        <p>Upload Image</p>
        <input type="file" accept="image/png" onChange={(e) => handleFileChange(e, "eraseImage")} />
        <p>Upload Mask (optional)</p>
        <input type="file" accept="image/png" onChange={(e) => handleFileChange(e, "eraseMask")} />
        <div style={{ marginTop: 10 }}>
          <button onClick={() => handleAction("erase")} disabled={!eraseImageFile}>
            Erase
          </button>
          <button onClick={() => clearSection("erase")} disabled={!eraseImgUrl} style={{ marginLeft: 10 }}>
            Clear
          </button>
        </div>
        {eraseImgUrl && <img src={eraseImgUrl} alt="Erased" style={{ marginTop: 10, maxWidth: "100%" }} />}
      </section>
    </div>
  );
}
