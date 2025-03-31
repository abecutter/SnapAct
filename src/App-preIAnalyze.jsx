import React, { useState } from 'react';
import * as exifr from 'exifr';
import { extractEntitiesWithGPT } from './services/entityExtractor';


function App() {
  const [image, setImage] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [exifData, setExifData] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);
  const [businessName, setBusinessName] = useState(null);
  const [ocrLines, setOcrLines] = useState([]);
  const [entities, setEntities] = useState(null);
  const [exifError, setExifError] = useState(null);
  const [gptError, setGptError] = useState(null);

  const endpoint = import.meta.env.VITE_AZURE_VISION_ENDPOINT;
const apiKey = import.meta.env.VITE_AZURE_VISION_KEY;


  const getExifFromImage = async (file) => {
    try {
      const gps = await exifr.gps(file);
      const parsed = await exifr.parse(file);
      if (!parsed) throw new Error("No EXIF metadata found.");
      const data = { ...parsed, gps };
      setExifData(data);

      if (gps?.latitude && gps?.longitude) {
        const label = await fetchLocationLabel(gps.latitude, gps.longitude);
        setLocationLabel(label);
        const business = await fetchBusinessName(gps.latitude, gps.longitude);
        setBusinessName(business);
      }
    } catch (error) {
      setExifError("EXIF extraction failed or no metadata found.");
      setExifData(null);
      setLocationLabel(null);
      setBusinessName(null);
    }
  };

  const fetchLocationLabel = async (lat, lon) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return data.display_name || null;
  };

  const fetchBusinessName = async (lat, lon) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
    const data = await res.json();
    return data.name || data.address?.amenity || data.address?.shop || null;
  };

  const analyzeImageWithAzure = async (file) => {
    setLoading(true);
    setGptError(null);
    setEntities(null);

    try {
      await getExifFromImage(file);

      const response = await fetch(`${endpoint}vision/v3.2/read/analyze`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/octet-stream"
        },
        body: file
      });

      const operationLocation = response.headers.get("operation-location");
      if (!operationLocation) throw new Error("Missing operation-location header in Azure response.");

      let result = null;
      for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 1000));
        const pollRes = await fetch(operationLocation, {
          headers: {
            "Ocp-Apim-Subscription-Key": apiKey
          }
        });

        result = await pollRes.json();
        if (result.status === "succeeded") break;
      }

      if (!result || result.status !== "succeeded") {
        throw new Error("Azure OCR did not complete successfully.");
      }

      const lines = result?.analyzeResult?.readResults?.flatMap(page =>
        page.lines.map(line => line.text)
      ) || [];

      setOcrLines(lines);

      // 👇 Join text and pass to GPT
      const fullText = lines.join(' ');
      if (fullText.length > 10) {
        const structured = await extractEntitiesWithGPT(fullText);
        setEntities(structured);
      }
    } catch (error) {
      console.error("OCR + GPT error:", error);
      setGptError("Entity extraction failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
      analyzeImageWithAzure(file);
    }
  };

  const isHeic = imageFileName.toLowerCase().endsWith(".heic");

  return (
    <div style={{ padding: '1rem', maxWidth: '500px', margin: 'auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>📸 Image-to-Actions</h1>

      <input
        type="file"
        accept="image/*,.heic"
        onChange={handleImageUpload}
        style={{ marginBottom: '1rem' }}
      />

      {image && (
        isHeic ? (
          <p style={{ color: '#c00' }}>HEIC image preview not supported. Uploaded.</p>
        ) : (
          <img src={image} alt="Preview" style={{ width: '100%', marginBottom: '1rem' }} />
        )
      )}

      {loading && <p>Analyzing image...</p>}

      {exifError && <p style={{ color: 'darkred' }}>{exifError}</p>}

      {exifData && (
        <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <h2>EXIF Preview</h2>
          <pre>{JSON.stringify(exifData, null, 2)}</pre>
          {locationLabel && (
            <p><strong>Closest Address:</strong> {locationLabel}</p>
          )}
          {businessName && (
            <p><strong>Nearby Business:</strong> {businessName}</p>
          )}
        </div>
      )}

      {ocrLines.length > 0 && (
        <div style={{ textAlign: 'left' }}>
          <h2>OCR Result</h2>
          <ul>
            {ocrLines.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>
      )}

      {entities && (
        <div style={{ textAlign: 'left', marginTop: '1rem' }}>
          <h2>🧠 Extracted Entities (from GPT)</h2>
          <pre>{JSON.stringify(entities, null, 2)}</pre>
        </div>
      )}

      {gptError && <p style={{ color: 'red' }}>{gptError}</p>}
    </div>
  );
}

export default App;
