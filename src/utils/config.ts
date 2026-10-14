import { DEFAULT_EMOJI, defaultUploadImage, getLang, getLocale, getMeta } from '../config/index.js';
import type {
  WalineEmojiInfo,
  WalineEmojiMaps,
  WalineEmojiPresets,
  WalineImageUploader,
  WalineLocale,
  WalineProps,
} from '../typings/index.js';
import { decodePath, isLinkHttp, removeEndingSplash } from './path.js';

export interface WalineEmojiConfig {
  tabs: Pick<WalineEmojiInfo, 'name' | 'icon' | 'items'>[];
  map: WalineEmojiMaps;
}

export interface WalineConfig extends Required<
  Omit<WalineProps, 'emoji' | 'imageUploader' | 'wordLimit'>
> {
  locale: WalineLocale;
  wordLimit: [number, number] | false;
  emoji: (WalineEmojiInfo | WalineEmojiPresets)[] | null;
  imageUploader: WalineImageUploader | null;
}

const getServerURL = (serverURL: string): string => {
  const result = removeEndingSplash(serverURL);

  return isLinkHttp(result) ? result : `https://${result}`;
};

const getWordLimit = (wordLimit: WalineProps['wordLimit']): [number, number] | false =>
  Array.isArray(wordLimit)
    ? wordLimit
    : typeof wordLimit === 'number' && wordLimit > 0
      ? [0, wordLimit]
      : false;

const withFallback = <T = unknown>(value: T | boolean | undefined, fallback: T): T | null =>
  value == null || value === true ? fallback : value === false ? null : value;

export const getConfig = ({
  serverURL,
  path = location.pathname,
  lang = typeof navigator === 'undefined' ? 'zh-CN' : navigator.language,
  locale,
  meta = ['nick', 'mail', 'link'],
  requiredMeta = [],
  dark = false,
  pageSize = 10,
  wordLimit,
  noRss = false,
  login = 'enable',
  commentSorting = 'latest',
  emoji = DEFAULT_EMOJI,
  imageUploader,
}: WalineProps): WalineConfig => ({
  serverURL: getServerURL(serverURL),
  path: decodePath(path),
  lang: getLang(lang),
  locale: {
    ...getLocale(getLang(lang)),
    ...(typeof locale === 'object' ? locale : {}),
  } as WalineLocale,
  wordLimit: getWordLimit(wordLimit),
  meta: getMeta(meta),
  requiredMeta: getMeta(requiredMeta),
  dark,
  pageSize,
  commentSorting,
  login,
  noRss,
  imageUploader: withFallback(imageUploader, defaultUploadImage),
  emoji: withFallback(emoji, DEFAULT_EMOJI),
});
