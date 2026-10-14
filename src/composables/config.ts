import { computed, inject } from 'vue';
import type { ComputedRef } from 'vue';

import { configKey } from '../config/index.js';
import type { WalineLocale } from '../typings/index.js';
import type { WalineConfig } from '../utils/config.js';

export const useConfig = (): {
  config: ComputedRef<WalineConfig>;
  locale: ComputedRef<WalineLocale>;
} => {
  // oxlint-disable-next-line typescript/no-non-null-assertion
  const config = inject(configKey)!;

  return { config, locale: computed(() => config.value.locale) };
};
