import sharp from "sharp";

export async function generateThumbnail(imageBuffer: Buffer): Promise<{ thumbnailBuffer: Buffer; contentType: string }> {
  // Always output JPEG thumbnail for broad email client support
  const thumbnailBuffer = await sharp(imageBuffer)
    .rotate()
    .resize({ width: 512, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  return { thumbnailBuffer, contentType: "image/jpeg" };
}
