import type { WalineEmojiInfo, WalineEmojiPresets, WalineImageUploader } from './base.js';
import type { WalineProps } from './waline.js';

export interface WalineInitOptions extends Omit<WalineProps, 'path' | 'emoji' | 'imageUploader'> {
  /**
   * Waline 的初始化挂载器。必须是一个**有效的** CSS 选择器 或 HTML 元素
   *
   * The DOM element to be mounted on initialization. It must be a **valid** CSS selector string or
   * HTML Element.
   */
  el?: string | HTMLElement | null;

  /**
   * 当前 _文章页_ 路径，用于区分不同的 _文章页_ ，以保证正确读取该 _文章页_ 下的评论列表
   *
   * 你可以将其设置为 `window.location.pathname`
   *
   * Article path id. Used to distinguish different _article pages_ to ensure loading the correct
   * comment list under the _article page_.
   *
   * You can set it to `window.location.pathname`
   *
   * @default window.location.pathname
   */
  path?: string;

  /**
   * 设置表情包
   *
   * Set Emojis
   *
   * @default ['//unpkg.com/@waline/emojis@1.1.0/weibo']
   */
  emoji?: (WalineEmojiInfo | WalineEmojiPresets)[] | boolean;

  /**
   * 自定义图片上传方法，方便更好的存储图片
   *
   * 方法执行时会将图片对象传入。
   *
   * Custom image upload callback to manage picture by yourself.
   *
   * We will pass a picture file object when execute it.
   *
   * @default true
   */

  imageUploader?: WalineImageUploader | boolean;
}
