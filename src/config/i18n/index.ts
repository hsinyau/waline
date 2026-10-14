import type { WalineLocale } from '../../typings/index.js';
import zhCN from './zh-CN.js';

export type Locales = Record<string, WalineLocale>;

export const DEFAULT_LANG = 'zh-CN';

export const DEFAULT_LOCALES: Locales = {
  zh: zhCN,
  'zh-cn': zhCN,
};

export const getLocale = (lang: string): WalineLocale =>
  DEFAULT_LOCALES[lang.toLowerCase()] ?? DEFAULT_LOCALES[DEFAULT_LANG.toLowerCase()];

export const getLang = (lang: string): string =>
  Object.keys(DEFAULT_LOCALES).includes(lang.toLowerCase()) ? lang : DEFAULT_LANG;
