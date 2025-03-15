import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

/**
 * Generates a SHA256 hash for a file
 */
export function generateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Creates a sanitized filename with only alphanumeric and underscore characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove extension
  const name = path.parse(filename).name;
  
  // Convert to lowercase and replace non-alphanumeric characters with underscores
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Creates a thumbnail version of an image
 */
export async function createThumbnail(
  sourcePath: string, 
  destPath: string, 
  width: number = 300
): Promise<void> {
  await sharp(sourcePath)
    .resize({ width, withoutEnlargement: true })
    .toFile(destPath);
}

/**
 * Ensures a directory exists, creating it if necessary
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}