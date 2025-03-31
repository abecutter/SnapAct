import React, { useState } from 'react';
import * as exifr from 'exifr';
import { extractEntitiesWithGPT } from './services/entityExtractor';
import { analyzeImageWithTags } from './services/imageAnalyzer';
import { classifyImageContent } from './services/contentClassifier';
import intentActionMap from './services/intentActionMapExpanded';
import { deepAnalyzeWithGPT } from './services/deepAnalyzer.js';



function App() {
  const [image, setImage] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [exifData, setExifData] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);
  const [businessName, setBusinessName] = useState(null);
  const [ocrLines, setOcrLines] = useState([]);
  const [entities, setEntities] = useState(null);
  const [visionData, setVisionData] = useState(null);
  const [exifError, setExifError] = useState(null);
  const [gptError, setGptError] = useState(null);
  const [inferred, setInferred] = useState(null);


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
    setVisionData(null);
    setInferred(null); // NEW: Clear inferred state
  
    try {
      await getExifFromImage(file);
  
      // Step 1: OCR
      const ocrRes = await fetch(`${endpoint}vision/v3.2/read/analyze`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/octet-stream"
        },
        body: file
      });
  
      const opLocation = ocrRes.headers.get("operation-location");
      if (!opLocation) throw new Error("Missing operation-location header in Azure OCR response.");
  
      let result = null;
      for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 1000));
        const poll = await fetch(opLocation, {
          headers: { "Ocp-Apim-Subscription-Key": apiKey }
        });
        result = await poll.json();
        if (result.status === "succeeded") break;
      }
  
      const lines = result?.analyzeResult?.readResults?.flatMap(p => p.lines.map(l => l.text)) || [];
      setOcrLines(lines);
      const ocrText = lines.join(' ');
  
      // Step 2: Image Analysis
      const vision = await analyzeImageWithTags(file, apiKey, endpoint);
      setVisionData(vision);
  
      // Step 3: Merge all into Deep Analysis
const deepResults = await deepAnalyzeWithGPT({
    ocrText,
    exif: exifData || {},
    vision
  });
  
  setInferred(deepResults); // used for rendering Deep Mode output
  
  
     // Step 4: Classify content type using GPT hints + fallback decision tree
const entityHints = structured || {};
let contentType = null;

// Let GPT lead if it gives strong signals
if (entityHints.event) contentType = "EventFlyer";
else if (entityHints.products?.length > 0 && entityHints.people?.length > 0) contentType = "Book";
else if (entityHints.products?.length > 0) contentType = "Product";
else if (entityHints.website && entityHints.people?.length === 0) contentType = "Generic";
else contentType = classifyImageContent({
  vision,
  ocrText,
  exif: exifData || {}
});

console.log("Final inferred content type:", contentType);

// Map to intents
const contentTypeToIntents = {
  Book: ["learn about book", "explore author", "buy product"],
  EventFlyer: ["attend event", "listen to artist", "share with others"],
  PartialArticle: ["find full article", "summarize text"],
  Clothing: ["explore fashion item", "buy product"],
  Product: ["buy product", "learn about product"],
  Generic: ["extract text", "save for later"],
};

const inferredIntents = contentTypeToIntents[contentType] || [];

setInferred({
  contentType,
  intents: inferredIntents,
  actions: inferredIntents.flatMap(intent => intentActionMap[intent] || [])
});
  
    } catch (error) {
      console.error("OCR + Vision + GPT error:", error);
      setGptError("Analysis failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Analyzing file:", file);
      console.log("File type:", file.type);
      console.log("File size:", file.size);
      console.log("Is file a Blob?", file instanceof Blob);
      setImageFileName(file.name || "image.jpg");

  
      analyzeImageWithAzure(file); // send to analyzer
  
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  

  return (
    <>
      <div style={{ padding: '1rem', maxWidth: '500px', margin: 'auto', textAlign: 'center' }}>
        <h1>📸 Image-to-Actions Prototype</h1>
  
        <input type="file" accept="image/*,.heic" onChange={handleImageUpload} style={{ marginBottom: '1rem' }} />
        {image && <img src={image} alt="Preview" style={{ width: '100%', marginBottom: '1rem' }} />}
  
        {loading && <p>Analyzing image...</p>}
        {exifError && <p style={{ color: 'red' }}>{exifError}</p>}
        {gptError && <p style={{ color: 'red' }}>{gptError}</p>}
  
        {exifData && (
          <div style={{ textAlign: 'left' }}>
            <h3>EXIF</h3>
            <pre>{JSON.stringify(exifData, null, 2)}</pre>
            {locationLabel && <p><strong>Closest Address:</strong> {locationLabel}</p>}
            {businessName && <p><strong>Nearby Business:</strong> {businessName}</p>}
          </div>
        )}
  
        {ocrLines.length > 0 && (
          <div style={{ textAlign: 'left' }}>
            <h3>OCR</h3>
            <ul>{ocrLines.map((line, i) => <li key={i}>{line}</li>)}</ul>
          </div>
        )}
  
        {visionData && (
          <div style={{ textAlign: 'left' }}>
            <h3>Image Analysis</h3>
            <pre>{JSON.stringify(visionData, null, 2)}</pre>
          </div>
        )}
  
        {entities && (
          <div style={{ textAlign: 'left' }}>
            <h3>🧠 GPT Entities</h3>
            <pre>{JSON.stringify(entities, null, 2)}</pre>
          </div>
        )}
      </div>
  
      {inferred && (
  <div style={{ textAlign: 'left', marginTop: '2rem' }}>
    <h2>🧠 Deep GPT Analysis</h2>
    <p><strong>Type:</strong> {inferred.content_type}</p>

    <p><strong>Intents:</strong></p>
    <ul>
      {inferred.intents?.map((intent, i) => (
        <li key={i}>{intent}</li>
      ))}
    </ul>

    <p><strong>Actions:</strong></p>
    <ul>
      {inferred.actions?.map((action, i) => (
        <li key={i}>
          <button
            style={{
              margin: '0.25rem 0',
              padding: '0.5rem',
              fontSize: '0.85rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: '#eee'
            }}
            onClick={() => console.log("Trigger:", action)}
          >
            {action}
          </button>
        </li>
      ))}
    </ul>

    <p style={{ fontStyle: 'italic', color: '#555', marginTop: '1rem' }}>
      💬 <strong>Why:</strong> {inferred.explanation}
    </p>
  </div>
)}

    </>
  );
  
}

export default App;
