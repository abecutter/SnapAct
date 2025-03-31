// src/services/contentClassifier.js

export function classifyImageContent({ vision, ocrText = "", exif }) {
    const text = ocrText.toLowerCase();
    const tags = vision?.tags?.map(t => t.toLowerCase()) || [];
  
    // Book detection
    if (tags.includes("book") || /by\s+\w/.test(text)) {
      return "Book";
    }
  
    // Event flyer
    if (text.match(/\b\d{1,2}:\d{2}(am|pm)?\b/i) && text.includes("tickets")) {
      return "EventFlyer";
    }
  
    // Article snippet
    if (text.length > 300 && text.includes("...")) {
      return "PartialArticle";
    }
  
    // Clothing / T-Shirt
    if (tags.includes("clothing") || tags.includes("apparel") || text.match(/graphic tee|t-shirt/i)) {
      return "Clothing";
    }
  
    // Product
    if (tags.includes("product") || tags.includes("label") || tags.includes("brand")) {
      return "Product";
    }
  
    return "Generic";
  }
  