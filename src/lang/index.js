import { createI18n } from 'vue-i18n';
import { PostMetaDataVariables } from '@utils/PostMetaData';
import { publicPath } from '@utils/basePath';
import { nextTick } from 'vue';
import { isNil, uniq, merge } from 'lodash';
import { PLUGIN } from '../../pluginconfig.js';

const DEFAULT_LANG = 'en';
const SERVER_LANG = PostMetaDataVariables.language;

const isPluginMode = import.meta.env.VITE_PLUGIN_MODE === 'true';
const isStandalone = !isPluginMode;
const isProd = import.meta.env.PROD;

// Workspace shared translations
let ROOT_I18N_PATH = isStandalone && isProd ? './i18n/workspace/' : '/workspace/public/i18n/';

// Own AaaS translations
let APP_I18N_PATH = isStandalone // on build assets get copied to special folder to avoid conflict
  ? isProd
    ? './i18n/'
    : `${publicPath}/i18n/`
  : /* is PLUGIN*/ isProd
  ? `/workspace/plugins/${PLUGIN.name}/i18n/`
  : `/workspace-dev/dist_plugins/${PLUGIN.name}/i18n/`;

// console.log({ APP_I18N_PATH, ROOT_I18N_PATH })
// console.log({ isPluginMode, importMetaEnvProd: import.meta.env.PROD })
// console.log({ basePath })
let messages = [];
const i18n = createI18n({
  /* 
  IMPORTANT:
  AaaS i18n instance to use the composition API (legacy: false, globalInjection: true). That stops vue-i18n from trying to assign $t onto each component instance—the step that was triggering the proxy “trap returned falsish” error in this bundle—while still injecting $t, $tc, etc. through app.config.globalProperties. The rest of the loader stays the same, so root translations are still merged ahead of the local overrides.
  Please reload the dev server and hit the login view again; you should no longer see the proxy error, and the root strings should render correctly. Let me know if anything’s still off. 
  */
  legacy: false,
  locale: SERVER_LANG,
  fallbackLocale: DEFAULT_LANG,
  sync: true,
  globalInjection: true,
  messages: messages,
});

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Resource not found: ${url}`);
        }
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      if (i === retries - 1 || err.message.includes('Resource not found')) {
        throw err;
      }
      console.warn(`Retrying (${i + 1}/${retries})...`);
    }
  }
};

const loadLanguages = async (langs, retries = 3) => {
  langs = uniq(langs);

  const promises = langs.map(async (lang) => {
    try {
      const aaasDicUrl = `${APP_I18N_PATH}${lang}.json`;
      const rootDicUrl = `${ROOT_I18N_PATH}${lang}.json`;

      const [rootDict, aaasDict] = await Promise.all([
        fetchWithRetry(rootDicUrl, {}, retries),
        fetchWithRetry(aaasDicUrl, {}, retries),
      ]);
      const dict = merge({}, rootDict, aaasDict);
      return { lang, dict };
    } catch (err) {
      console.error(`Failed to load language ${lang}:`, err);
    }
  });

  const jsons = await Promise.allSettled(promises);

  const dictionaries = jsons
    .filter((t) => t.status === 'fulfilled' && t.value !== undefined)
    .reduce((acc, x) => {
      acc[x.value.lang] = x.value.dict;
      return acc;
    }, {});

  return dictionaries;
};

const load = async () => {
  const langMessages = await loadLanguages([DEFAULT_LANG, ...(!isNil(SERVER_LANG) ? [SERVER_LANG] : [])]);

  Object.keys(langMessages).forEach((lang) => {
    try {
      i18n.global.setLocaleMessage(lang, langMessages[lang]);
    } catch (err) {
      console.error(`Failed to load language ${lang}:`, err);
    }
  });

  await nextTick();
  return i18n;
};

export const loadLanguagesAsync = load();

export default i18n;
