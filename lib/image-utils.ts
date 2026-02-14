export const THUMBNAIL_MAX_SIZE = 400;
export const THUMBNAIL_QUALITY = 0.7;

/**
 * Resize an image file to a maximum dimension while maintaining aspect ratio.
 * Returns original file as-is if already smaller than maxSize.
 * Falls back to original file on any error.
 */
export async function resizeImage(
  file: File,
  maxSize: number = THUMBNAIL_MAX_SIZE,
  quality: number = THUMBNAIL_QUALITY
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // No upscaling — return original if already small enough
    if (width <= maxSize && height <= maxSize) {
      bitmap.close();
      return file;
    }

    const scale = maxSize / Math.max(width, height);
    const newW = Math.round(width * scale);
    const newH = Math.round(height * scale);

    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, newW, newH);
    bitmap.close();

    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality,
    });

    return blob;
  } catch {
    // Graceful degradation — return original
    return file;
  }
}
