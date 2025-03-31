export async function deepAnalyzeWithGPT({ ocrText, exif = {}, vision = {} }) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const endpoint = "https://api.openai.com/v1/chat/completions";
  
    const safeOcrText = ocrText?.slice(0, 3000) || "";
    const safeVision = {
      ...vision,
      tags: vision.tags?.slice(0, 10),
      objects: vision.objects?.slice(0, 10),
      brands: vision.brands?.slice(0, 5),
    };
  
    const systemPrompt = `
  You are an intelligent image analysis agent. Your job is to analyze image-derived data and determine what the image is likely about, what the user might want, and suggest meaningful actions.
  
  You will receive:
  - OCR text (from a flyer, sign, product, article, etc.)
  - Vision tags and objects (from Azure image analysis)
  - EXIF metadata (location, timestamp, etc.)
  
  Return structured JSON with:
  {
    content_type: string,             // e.g. "EventFlyer", "Book", "Product", etc.
    intents: string[],                // what the user might want
    actions: string[],                // real-world things they might want to do
    explanation: string               // a short natural language explanation
  }
  `;
  
    const userPrompt = `
  OCR Text:
  ${safeOcrText}
  
  Vision Tags/Objects:
  ${JSON.stringify(safeVision)}
  
  EXIF Metadata:
  ${JSON.stringify(exif)}
  `;
  
    const body = {
      model: "gpt-3.5-turbo",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() }
      ]
    };
  
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
  
    if (!res.ok) {
      const err = await res.text();
      throw new Error("OpenAI API error: " + err);
    }
  
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
  
    try {
      return JSON.parse(reply);
    } catch (err) {
      console.warn("Failed to parse GPT reply:", reply);
      return null;
    }
  }
  