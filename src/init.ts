import type { App } from 'vue';
import { createApp, h, reactive } from 'vue';

import Waline from './components/WalineComment.vue';
import type { WalineInitOptions } from './typings/index.js';
import { getRoot } from './utils/index.js';

export interface WalineInstance {
  /**
   * Waline 被挂载到的元素
   *
   * 当通过 `el: null` 初始化，值为 `null` Element where Waline is mounted
   *
   * When initialized with `el: null`, it will be `null`
   */
  el: HTMLElement | null;

  /**
   * 更新 Waline 实例
   *
   * 只要不设置`path` 选项，更新时它就会被重置为 `windows.location.pathname` Update Waline instance
   *
   * When not setting `path` option, it will be reset to `window.location.pathname`
   */
  update: (newOptions?: Partial<Omit<WalineInitOptions, 'el'>>) => void;

  /**
   * 取消挂载并摧毁 Waline 实例
   *
   * Unmount and destroy Waline instance
   */
  destroy: () => void;
}

export const init = ({
  el = '#waline',
  path = window.location.pathname,
  ...initProps
}: WalineInitOptions): WalineInstance | null => {
  // check el element
  // oxlint-disable-next-line typescript/strict-boolean-expressions
  const root = el ? getRoot(el) : null;

  // check root
  // oxlint-disable-next-line typescript/strict-boolean-expressions
  if (el && !root) {
    throw new Error(`Option 'el' do not match any domElement!`);
  }

  // check serverURL
  if (!initProps.serverURL) {
    throw new Error("Option 'serverURL' is missing!");
  }

  const props = reactive({ ...initProps });
  const state = reactive({ path });

  let app: App<Element> | null = null;

  if (root) {
    app = createApp(() => h(Waline, { path: state.path, ...props }));

    app.mount(root);
  }

  return {
    el: root,
    update: ({
      path = window.location.pathname,
      ...newProps
    }: Partial<Omit<WalineInitOptions, 'el'>> = {}): void => {
      Object.assign(props, newProps);

      state.path = path;
    },
    destroy: (): void => {
      app?.unmount();
    },
  };
};
