import './env.js';
import '@utils/defineCoreImports';
import { createApp } from 'vue';

import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import 'primeflex/primeflex.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primevue/resources/themes/bootstrap4-light-blue/theme.css';
import '@assets/scss/themes/light-theme/theme.scss';
import '@assets/scss/themes/dark-theme/theme.scss';
import '@assets/scss/themes/blue-theme/theme.scss';
import '@assets/scss/themes/new-light-theme/theme.scss';
import '@assets/scss/themes/new-dark-theme/theme.scss';
import '@assets/scss/base.scss';
import '@aaas/assets/icons/css/thinfinity-icons.min.css';
import '@aaas/assets/icons-new/css/cybele-icons.min.css';
import '@aaas/assets/TwsFont/css/tws-font.min.css';
import '@aaas/assets/fonts/fonts.css';
import 'v-calendar/dist/style.css';
import './assets/app-overrides.scss';
import i18n, { loadLanguagesAsync } from '@lang';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { setupPersistence, defaultQueryClientOptions } from 'workspace-lib-utils/src/TQueryClient';
import 'core-js/actual'; // for Polyfills
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import TConfirmationService from '@components/Dialogs/TConfirmDialog/TConfirmationService.js';
import Tooltip from 'primevue/tooltip';
// import Toast from 'primevue/toast';
// import ConfirmDialog from 'primevue/confirmdialog';
// import TConfirmDialog from '@components/Dialogs/TConfirmDialog/TConfirmDialog.vue';
// import Dialog from 'primevue/dialog';
// import Button from 'primevue/button';
import { fetchQueryClientUserInfo } from '@queries/auth';
import InputText from 'primevue/inputtext';

// apps/AaaS/src/main.js
if (import.meta.env.DEV) {
  const base = import.meta.env.BASE_URL; // '/workspace-dev-aaas/'
  const css = `
@font-face {
  font-family: thinfinity-icons;
  src:
    url('${base}icons/font/thinfinity-icons.woff2?83917939') format('woff2'),
    url('${base}icons/font/thinfinity-icons.woff?83917939') format('woff'),
    url('${base}icons/font/thinfinity-icons.ttf?83917939') format('truetype');
  font-weight: 400;
  font-style: normal;
}`;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
}

//window.Thinfinity.Messaging.API = {};

// Create QueryClient using original Vue Query with shared configuration
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

// Setup persistence using shared function (disabled for wrapper)
const usePersisters = false;
if (usePersisters) {
  setupPersistence(queryClient, {
    usePersisters: true,
    readFromCache: true, // Don't read from cache
    writeToCache: true, // Write to cache
  })
    .then((result) => {
      if (result.success) {
        console.log(
          `Wrapper app: Persistence setup with ${result.persister} (read: ${result.readFromCache}, write: ${result.writeToCache})`
        );
      } else {
        console.warn(`Wrapper app: Persistence setup failed - ${result.reason}`);
      }
    })
    .catch((error) => {
      console.warn('Wrapper app: Persistence setup error:', error);
    });
}

Promise.allSettled([loadLanguagesAsync, fetchQueryClientUserInfo({ queryClient })]).finally(async () => {
  console.log('Languages loaded');

  const pinia = createPinia();
  setActivePinia(pinia);

  const { default: router } = await import('./router');
  const { createAaaSNavGuard } = await import('./router/authNavGuard');
  const { default: App } = await import('./App.vue');

  const app = createApp(App);

  app.directive('tooltip', Tooltip);
  // app.component('PrimeToast', Toast);
  // app.component('ConfirmDialog', ConfirmDialog);
  // app.component('TConfirmDialog', TConfirmDialog);
  // app.component('Dialog', Dialog);
  // app.component('Button', Button);
  app.component('InputText', InputText); // For reused components from workspace

  app.use(i18n);
  app.use(pinia);
  app.use(router);
  app.use(PrimeVue);
  app.use(ToastService);
  app.use(ConfirmationService);
  app.use(TConfirmationService);
  app.use(VueQueryPlugin, { queryClient });

  // Register navigation guard for authentication
  router.beforeEach(createAaaSNavGuard(queryClient));

  //app.use(VCalendar);
  //app.component('DatePicker', DatePicker);
  app.config.globalProperties.$BASE_URL = import.meta.env.BASE_URL;
  app.config.globalProperties.$sidePanel = null;

  app.config.warnHandler = () => {}; //disable vue's warnings on dev-mode

  app.mount('#app');
});
