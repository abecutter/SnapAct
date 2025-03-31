// src/services/intentActionMapExpanded.js

const expandedIntentActionMap = {
    // Event-related
    "attend event": ["Add to Calendar", "Get Tickets", "Get Directions", "Share Event", "Learn About Venue"],
    "listen to artist": ["Play on Spotify", "Watch on YouTube", "Read Artist Bio"],
  
    // Book/media
    "learn about book": ["View on Goodreads", "Get Summary", "Find Author", "Buy Physical Book", "Listen on Audible", "Buy on Kindle"],
    "explore author": ["Read Bio", "View Other Works", "Follow on Social Media"],
  
    // Product/Shopping
    "buy product": ["Buy on Amazon", "Compare Prices", "View Reviews", "Find Local Store"],
    "learn about product": ["Open Website", "Search Online", "View Related Products"],
  
    // Clothing/Fashion
    "explore fashion item": ["Identify Style", "Buy Similar Shirt", "Find Brand Info", "Match with Outfit Ideas"],
  
    // Articles / news
    "find full article": ["Search Online", "Suggest Source Sites", "Archive for Later"],
    "summarize text": ["Read Summary", "Translate", "Highlight Main Ideas"],
  
    // Generic
    "open website": ["Visit Page", "Copy Link", "Archive URL"],
    "get directions": ["Open in Google Maps", "Get ETA", "Check Business Hours"],
    "share with others": ["Copy to Clipboard", "Generate Social Post", "Send as Message"],
    "save for later": ["Add to Notes", "Bookmark", "Send to Email"],
  };
  
  export default expandedIntentActionMap;
  