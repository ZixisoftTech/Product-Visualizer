import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type StorageCategory = 'halls' | 'products' | 'generated' | 'thumbnails';

const UPLOAD_ROOT = path.join(process.cwd(), process.env.UPLOAD_DIR || 'public/uploads');

/**
 * Ensure storage directories exist.
 */
export function ensureUploadDirectories() {
  const categories: StorageCategory[] = ['halls', 'products', 'generated', 'thumbnails'];
  for (const cat of categories) {
    const dir = path.join(UPLOAD_ROOT, cat);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Generates a unique, collision-free filename.
 * Example: hall_20260915_a1b2c3d4.jpg
 */
export function generateUniqueFilename(prefix: string, ext: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const shortId = uuidv4().replace(/-/g, '').slice(0, 8);
  const cleanExt = ext.replace(/^\./, '').toLowerCase();
  return `${prefix}_${dateStr}_${shortId}.${cleanExt}`;
}

/**
 * Saves an image buffer to local filesystem in the requested category folder.
 * Returns the relative public path (e.g. /uploads/halls/...) and the absolute disk path.
 */
export async function saveImageToDisk(
  buffer: Buffer,
  category: StorageCategory,
  prefix: string,
  ext: string
): Promise<{ relativePath: string; absolutePath: string; filename: string }> {
  ensureUploadDirectories();
  const filename = generateUniqueFilename(prefix, ext);
  const targetDir = path.join(UPLOAD_ROOT, category);
  const absolutePath = path.join(targetDir, filename);

  // Prevent path traversal
  const relativeCheck = path.relative(UPLOAD_ROOT, absolutePath);
  if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
    throw new Error('Illegal path traversal detected');
  }

  await fs.promises.writeFile(absolutePath, buffer);
  const relativePath = `/uploads/${category}/${filename}`;

  return { relativePath, absolutePath, filename };
}

/**
 * Resolves a public relative upload path to an absolute disk path safely.
 */
export function resolveUploadDiskPath(relativePath: string): string {
  // Remove leading slash or prefix
  const cleanRel = relativePath.replace(/^\/+/, '');
  // public/uploads/... or uploads/...
  let subPath = cleanRel;
  if (subPath.startsWith('public/uploads/')) {
    subPath = subPath.replace(/^public\/uploads\//, '');
  } else if (subPath.startsWith('uploads/')) {
    subPath = subPath.replace(/^uploads\//, '');
  }

  const absolutePath = path.resolve(UPLOAD_ROOT, subPath);

  // Validate path stays inside UPLOAD_ROOT
  const relativeCheck = path.relative(UPLOAD_ROOT, absolutePath);
  if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
    throw new Error('Invalid path traversal attempted');
  }

  return absolutePath;
}

/**
 * Reads an image buffer from relative path.
 */
export async function readImageBuffer(relativePath: string): Promise<Buffer> {
  const absPath = resolveUploadDiskPath(relativePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found on disk: ${relativePath}`);
  }
  return await fs.promises.readFile(absPath);
}
