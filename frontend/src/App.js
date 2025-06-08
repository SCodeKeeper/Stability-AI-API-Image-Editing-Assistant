// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleAction = async (action) => {
    const formData = new FormData();
    formData.append('prompt', prompt);
    if (image) formData.append('image', image);

    try {
      const res = await axios.post(`http://localhost:5000/${action}`, formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageBlob = res.data;
      const imageObjectURL = URL.createObjectURL(imageBlob);
      setImageUrl(imageObjectURL);
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="app-container">
      <h1>Stability AI Image Editor</h1>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
        className="prompt-input"
      />
      <input type="file" accept="image/png" onChange={handleFileChange} className="file-input" />

      <div className="button-group">
        <button onClick={() => handleAction('generate')}>Generate Image</button>
        <button onClick={() => handleAction('erase')} disabled={!image}>Erase</button>
        <button onClick={() => handleAction('inpaint')} disabled={!image}>Inpaint</button>
      </div>

      {imageUrl && (
        <div className="image-preview">
          <h2>Result</h2>
          <img src={imageUrl} alt="Generated" />
        </div>
      )}
    </div>
  );
}

export default App;
