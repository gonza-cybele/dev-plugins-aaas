import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import TConfirmationService from '@components/Dialogs/TConfirmDialog/TConfirmationService.js';
import Tooltip from 'primevue/tooltip';
import InputText from 'primevue/inputtext';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { defaultQueryClientOptions } from 'workspace-lib-utils/src/TQueryClient';
import i18n, { loadLanguagesAsync } from '@lang';
import router from './router';
import PluginView from './PluginView.vue';

/**
 * Mounts the AaaS plugin into a host-provided DOM element.
 *
 * Creates a separate Vue app (using the remote's own Vue) with all
 * necessary plugins (router, pinia, PrimeVue, vue-query, i18n).
 * This avoids cross-Vue VNode Symbol conflicts with the host.
 */
export async function mount(el, { pinia: hostPinia } = {}) {
  // Wait for language files (loading started at module evaluation)
  await loadLanguagesAsync.catch((err) => {
    console.warn('[AaaS Plugin] Language loading failed, continuing without translations:', err);
  });

  const pinia = createPinia();
  if (hostPinia) {
    // Share the host's reactive state tree so remote stores
    // can read/write the same state as the host.
    pinia.state.value = hostPinia.state.value;
  }
  setActivePinia(pinia);

  const queryClient = new QueryClient({
    ...defaultQueryClientOptions,
    defaultOptions: {
      ...defaultQueryClientOptions.defaultOptions,
      queries: {
        ...defaultQueryClientOptions.defaultOptions.queries,
        cacheTime: Infinity,
      },
    },
  });

  const app = createApp(PluginView);

  app.directive('tooltip', Tooltip);
  app.component('InputText', InputText);

  app.use(i18n);
  app.use(pinia);
  app.use(router);
  app.use(PrimeVue);
  app.use(ToastService);
  app.use(ConfirmationService);
  app.use(TConfirmationService);
  app.use(VueQueryPlugin, { queryClient });

  // No auth nav guard — the host already handles authentication
  app.config.globalProperties.$BASE_URL = import.meta.env.BASE_URL;
  app.config.globalProperties.$sidePanel = null;
  app.config.warnHandler = () => {};

  app.mount(el);

  return {
    unmount: () => app.unmount(),
  };
}

export default { mount };
