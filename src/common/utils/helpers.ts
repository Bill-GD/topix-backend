import * as path from 'node:path';

export function getDistPath(): string {
  let dir = __dirname;
  while (!dir.endsWith('dist')) {
    dir = path.dirname(dir);
  }
  return dir;
}

export function getUploadsPath(filename: string): string {
  return `${getDistPath()}/public/uploads/${filename}`;
}
