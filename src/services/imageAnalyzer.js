function inferMimeType(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".heic")) return "image/heic";
    if (lower.endsWith(".webp")) return "image/webp";
    return "application/octet-stream"; // Fallback
  }
  
  async function reencodeImage(file, mimeType) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to re-encode image."));
          }
        }, mimeType || "image/jpeg", 0.95);
      };
      img.onerror = () => reject(new Error("Failed to load image for re-encoding."));
      img.src = url;
    });
  }
  
  export async function analyzeImageWithTags(file, azureKey, azureEndpoint) {
    const url = `${azureEndpoint}vision/v3.2/analyze?visualFeatures=Tags,Description,Objects,Brands`;
  
    const inferMimeType = (fileName) => {
      const lower = fileName?.toLowerCase() || "";
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
      if (lower.endsWith(".png")) return "image/png";
      if (lower.endsWith(".webp")) return "image/webp";
      return "application/octet-stream";
    };
  
    const mimeType = inferMimeType(file.name);
    const originalTry = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": azureKey,
        "Content-Type": mimeType,
      },
      body: file,
    });
  
    if (originalTry.ok) {
      const data = await originalTry.json();
      return {
        tags: data.tags?.map((t) => t.name),
        caption: data.description?.captions?.[0]?.text || null,
        brands: data.brands?.map((b) => b.name),
        objects: data.objects?.map((o) => o.object),
      };
    }
  
    console.warn("Initial image analysis failed, trying re-encoded image...");
  
    // 🔁 Re-encode to base64 and try again
    try {
      const base64 = await blobToBase64(file);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": azureKey,
          "Content-Type": "application/octet-stream",
        },
        body: dataURItoBlob(base64),
      });
  
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Azure Image Analysis error after re-encoding: ${text}`);
      }
  
      const data = await res.json();
      return {
        tags: data.tags?.map((t) => t.name),
        caption: data.description?.captions?.[0]?.text || null,
        brands: data.brands?.map((b) => b.name),
        objects: data.objects?.map((o) => o.object),
      };
    } catch (err) {
      throw new Error(`Azure Image Analysis error after re-encoding: ${err.message}`);
    }
  }
  
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
  
  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }
  
  