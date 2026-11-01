/** Decode an image URL into raw pixels. */
export function loadImageData(url: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas is not supported in this browser.'));
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => reject(new Error(`Could not read image: ${url}`));
    img.src = url;
  });
}

/** Decode a user-supplied file (upload, drop or paste). */
export async function fileToImageData(file: Blob): Promise<ImageData> {
  const url = URL.createObjectURL(file);
  try {
    return await loadImageData(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
