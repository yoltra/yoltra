/**
 * load an image from a URL/path and extract raw pixel data. */
export async function loadImagePixels(filePath: string): Promise<ImageData> {
  const res = await fetch(filePath);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);

  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);

  try {
    const W = bmp.width, H = bmp.height;

    // offscreenCanvas when available, else in-memory <canvas>
    const canvas: OffscreenCanvas | HTMLCanvasElement =
      typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H)
                                             : Object.assign(document.createElement("canvas"), { width: W, height: H });

    const ctx = (canvas as any).getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    if (!ctx) throw new Error("2D context not available");
    
    ctx.drawImage(bmp, 0, 0, W, H);

    const img = ctx.getImageData(0, 0, W, H);

    return img;

  } finally {
    bmp.close();
  }
}