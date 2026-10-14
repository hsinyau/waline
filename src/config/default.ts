import type { WalineEmojiPresets, WalineMeta } from '../typings/index.js';

const AVAILABLE_META = new Set<WalineMeta>(['nick', 'mail', 'link']);

export const getMeta = (meta: WalineMeta[]): WalineMeta[] =>
  meta.filter((item) => AVAILABLE_META.has(item));

export const DEFAULT_EMOJI: WalineEmojiPresets[] = ['//unpkg.com/@waline/emojis@1.1.0/weibo'];

export const defaultUploadImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.size > 128 * 1000) {
      reject(new Error('File too large! File size limit 128KB'));

      return;
    }

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.addEventListener('load', () => {
      resolve(reader.result as string);
    });
    reader.addEventListener('error', reject);
  });
