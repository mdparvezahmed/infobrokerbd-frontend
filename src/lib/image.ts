/**
 * Shrinks a photo in the browser before upload (max 1600px, JPEG). A 4MB phone photo becomes
 * ~300KB, which makes posting fast on mobile data. The server re-encodes and strips metadata anyway.
 */
export async function compressImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // e.g. a format the browser can't decode — let the server handle it
  }
}
