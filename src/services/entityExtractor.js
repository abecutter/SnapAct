export async function extractEntitiesWithGPT({ ocrText, exif = {}, vision = {} }) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const openaiEndpoint = "https://api.openai.com/v1/chat/completions";
  
    const MAX_OCR_LENGTH = 3000; // ~1000 tokens
    const safeOcrText = ocrText?.slice(0, MAX_OCR_LENGTH) || "";
  
    // Optionally simplify vision data
    const safeVision = {
      ...vision,
      tags: vision.tags?.slice(0, 10),
      objects: vision.objects?.slice(0, 10),
      brands: vision.brands?.slice(0, 5),
    };
  
    const systemMessage = {
      role: "system",
      content: `You are an assistant that extracts structured information from OCR text, EXIF metadata, and visual object labels. Your job is to identify people, places, events, prices, dates, products, websites, and implied user intentions. Respond with a JSON object with labeled fields and lists.`
    };
  
    const userMessage = {
      role: "user",
      content: `Here is data extracted from an image:\n\nOCR Text:\n${safeOcrText}\n\nEXIF:\n${JSON.stringify(exif)}\n\nVision Tags:\n${JSON.stringify(safeVision)}`
    };
  
    const body = {
      model: "gpt-3.5-turbo",
      messages: [systemMessage, userMessage],
      temperature: 0.2
    };
  
    const res = await fetch(openaiEndpoint, {
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
      console.warn("Failed to parse GPT response as JSON:", reply);
      return null;
    }
  }
  