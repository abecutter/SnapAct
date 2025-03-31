// src/services/intentActionMap.js

const intentActionMap = {
    "attend an event": [
      { label: "Add to Calendar", action: "calendar" },
      { label: "Get Directions", action: "maps" },
      { label: "View Venue Info", action: "venue" },
    ],
    "listen to artist": [
      { label: "Open on Spotify", action: "spotify" },
      { label: "Preview Track", action: "preview" },
      { label: "View Wikipedia Bio", action: "wikipedia" },
    ],
    "learn more about product": [
      { label: "Open Website", action: "product_website" },
      { label: "Search Product Online", action: "search" },
      { label: "View Reviews", action: "reviews" },
    ],
    "buy product": [
      { label: "Buy on Amazon", action: "buy_amazon" },
      { label: "Compare Prices", action: "compare" },
    ],
    "explore location": [
      { label: "Open in Google Maps", action: "maps" },
      { label: "View Business Hours", action: "business_hours" },
    ],
    "visit website": [
      { label: "Open Website", action: "open" },
      { label: "Save for Later", action: "bookmark" },
    ],
    "share with others": [
      { label: "Generate Social Post", action: "share" },
      { label: "Copy to Clipboard", action: "copy" },
    ],
    "attend a class/event/workshop": [
      { label: "RSVP Reminder", action: "rsvp" },
      { label: "View Speaker Info", action: "speaker" },
    ],
    "view schedule": [
      { label: "Open Schedule", action: "schedule" },
      { label: "Suggest Similar Events", action: "suggest" },
    ],
  };
  
  export default intentActionMap;
  