import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);

  const generateImage = async () => {
    try {
      const res = await axios.post(
        'http://localhost:5000/generate',
        { prompt },
        { responseType: 'blob' }
      );

      const imageBlob = res.data;
      const imageObjectURL = URL.createObjectURL(imageBlob);
      setImageUrl(imageObjectURL);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Stability AI Image Generator</h1>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
      />
      <button onClick={generateImage}>Generate Image</button>
      {imageUrl && <img src={imageUrl} alt="Generated" style={{ marginTop: 20, maxWidth: '100%' }} />}
    </div>
  );
}

export default App;
