import { nextTick } from 'vue';
import checkUserPermissions from '@utils/checkUserPermissions';
import { fetchQueryClientUserInfo } from '@queries/auth';
import { useBrowserLocation } from '@vueuse/core';

export const createAaaSNavGuard = (queryClient) => {
  const location = useBrowserLocation();
  const isPluginMode = import.meta.env.VITE_PLUGIN_MODE === 'true';

  return async (to) => {
    // Skip all authentication logic in plugin mode
    if (isPluginMode) {
      const pathname = location.value.pathname;
      window.history.replaceState(null, '', pathname);
      return true;
    }
    try {
      const search = new URL(window.location.href).search.toLowerCase();
      const hasSignIn = new URLSearchParams(search).has('signin');

      // Handle ?signin query param - redirect to login
      if (hasSignIn) {
        if (to.name !== 'login') {
          // Normalize url to signIn without extra parameters
          nextTick(() => window.history.replaceState(null, '', '?signin'));
          return `/login${search}`;
        } else {
          return true;
        }
      }

      // Skip auth check for login route
      if (to.name === 'login') {
        return true;
      }

      // Check user authentication status first
      const userInfo = await fetchQueryClientUserInfo({ queryClient });
      const isAuthenticated = userInfo?.authenticated || userInfo?.permissions?.canLogout;

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        return '/login';
      }

      // Check route-specific permissions if any are required
      const userAllowed = await checkUserPermissions(to?.meta?.permissions, {
        queryClient,
      });

      // If user doesn't have required permissions, redirect to login
      if (!userAllowed) {
        return '/login';
      }
    } catch (error) {
      // If there's an error fetching user info (e.g., network error, not authenticated), redirect to login
      console.warn('[AaaS Router Guard] Error checking authentication:', error);
      return '/login';
    }
    // const url = location.value.hash.replace('#', '');
    const pathname = location.value.pathname;

    window.history.replaceState(null, '', pathname);

    return true;
  };
};
