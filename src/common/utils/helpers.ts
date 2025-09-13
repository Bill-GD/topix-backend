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

export function getReadableSize(byte: number): string {
  let size = byte;
  const postfix = ['B', 'KB', 'MB'];
  let postfixIndex = 0;
  while (size > 1024) {
    size /= 1024;
    postfixIndex++;
  }
  return `${size} ${postfix[postfixIndex]}`;
}
