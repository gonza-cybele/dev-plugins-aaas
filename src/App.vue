<template>
  <div class="app-container" data-thinfinity-workspace>
    <template v-if="ready">
      <RouterView />
      <PrimeToast :autoZIndex="false" class="editor-toast" position="bottom-right" group="instances" />
    </template>
  </div>
</template>

<script setup>
import { onMounted /* , watch */ } from 'vue';
import { ref } from 'vue';
import PrimeToast from 'primevue/toast';
import { useServicesStore } from '@stores/services';
import useLocationRoute from '@utils/useLocationRoute';
import { usePingQuery } from '@queries/auth';
// import useGetTheme from '@utils/ui/useGetTheme';
//import { processSystemStoreUser, useSystemStore } from '../src/stores/system';
//import { useUserInfoQuery } from '@queries/auth';

// const queryClient = useQueryClient();
//useSystemStore();
//processSystemStoreUser({ userInfoQuery: useUserInfoQuery() });

const isPluginMode = import.meta.env.VITE_PLUGIN_MODE === 'true';

usePingQuery({
  queryConfig: {
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
  },
});

const ready = ref(false);
Promise.allSettled([]).then(() => (ready.value = true));

useServicesStore();
useLocationRoute();

/*
const theme = useGetTheme();
watch(
  theme,
  (newTheme, oldTheme) => {
    const body = document.body;
    if (body.classList) {
      if (oldTheme) oldTheme.split(' ').forEach((cls) => body.classList.remove(cls));
      if (newTheme) newTheme.split(' ').forEach((cls) => {
        if (cls.trim().length > 0) body.classList.add(cls);
      });
    }
  },
  { immediate: true }
); */
onMounted(() => {
  if (!isPluginMode) document.body.classList.add('new-light-mode'); // For now, dont suppport themes
});
</script>

<style scoped>
.app-container {
  background: var(--primary-bgcolor);
}
</style>
