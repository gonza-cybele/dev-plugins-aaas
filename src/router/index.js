import { createMemoryHistory, createRouter } from 'vue-router';
import AaaSLayout from '@aaas_layouts/AaaSLayout.vue';
import AppsHome from '@aaas_views/AppsHome/AppsHome.vue';
import LoginPage from '@aaas_views/LoginPage.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes:
    import.meta.env.VITE_PLUGIN_MODE === 'true'
      ? [
          {
            path: '/',
            name: 'root',
            component: AaaSLayout,
            redirect: '/apps-home',
            children: [
              {
                path: 'apps-home',
                name: 'apps-home',
                component: AppsHome,
              },
            ],
          },
        ]
      : [
          {
            path: '/login',
            name: 'login',
            component: LoginPage,
          },
          {
            path: '/',
            name: 'root',
            component: AaaSLayout,
            redirect: '/apps-home',
            children: [
              {
                path: 'apps-home',
                name: 'apps-home',
                component: AppsHome,
              },
            ],
          },
        ],
});

export default router;
