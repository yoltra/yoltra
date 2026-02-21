/**
 * Fetch an image from `url` and decode it into raw RGBA pixel data.
 * Uses `OffscreenCanvas` when available for better performance. */
export async function loadImagePixels(url: string): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);

  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);

  try {
    const W = bmp.width;
    const H = bmp.height;

    const canvas: OffscreenCanvas | HTMLCanvasElement =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(W, H)
        : Object.assign(document.createElement("canvas"), { width: W, height: H });

    const ctx = (canvas as OffscreenCanvas | HTMLCanvasElement)
      .getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    if (!ctx) throw new Error("2D context unavailable");

    ctx.drawImage(bmp, 0, 0, W, H);
    return (ctx as CanvasRenderingContext2D).getImageData(0, 0, W, H);
  } finally {
    bmp.close();
  }
}
