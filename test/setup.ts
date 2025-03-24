// Vitest setup file
import path from 'path';
import fs from 'fs';
import os from 'os';
import { afterAll, vi } from 'vitest';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set test environment variables
process.env.NODE_ENV = 'test';

// Function to create a temporary test database path
export function getTempDbPath() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memedb-test-'));
  return path.join(tempDir, 'test.sqlite3');
}

// Function to create a temporary meme directory
export function getTempMemeDir() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memedb-test-'));
  const memeDir = path.join(tempDir, 'memes');
  fs.mkdirSync(memeDir, { recursive: true });
  return memeDir;
}

// Increase Vitest timeout for database operations
vi.setConfig({ testTimeout: 10000 });

// Global teardown
afterAll(() => {
  // Any global cleanup can go here
});