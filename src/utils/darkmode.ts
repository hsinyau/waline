import { isString } from './type.js';

const DARK_VARIABLES = `{--waline-white:#000;--waline-light-grey:#a3a3a3;--waline-dark-grey:#d4d4d4;--waline-theme-color:#fff;--waline-active-color:#a3a3a3;--waline-color:#e5e5e5;--waline-bg-color:#171717;--waline-bg-color-light:#262626;--waline-bg-color-hover:#404040;--waline-border-color:#262626;--waline-disable-bg-color:#262626;--waline-disable-color:#737373;--waline-warning-color:#e5e5e5;--waline-warning-bg-color:#262626;--waline-bq-color:#262626;--waline-badge-color:#a3a3a3;--waline-info-bg-color:#262626;--waline-info-color:#a3a3a3}`;

export const getDarkStyle = (selector?: string | boolean): string =>
  isString(selector)
    ? selector === 'auto'
      ? `@media(prefers-color-scheme:dark){body${DARK_VARIABLES}}`
      : `${selector}${DARK_VARIABLES}`
    : selector === true
      ? `:root${DARK_VARIABLES}`
      : '';
