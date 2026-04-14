<template>
  <div class="app-container" data-thinfinity-workspace>
    <template v-if="ready">
      <RouterView />
      <PrimeToast :autoZIndex="false" class="editor-toast" position="bottom-right" group="instances" />
    </template>
  </div>
</template>

<script setup>
// await import('./mainAaaS.js');

import { onMounted /* , watch */ } from 'vue';
import { ref } from 'vue';
import PrimeToast from 'primevue/toast';
import { useServicesStore } from '@stores/services';
import useLocationRoute from '@utils/useLocationRoute';

const isPluginMode = import.meta.env.VITE_PLUGIN_MODE === 'true';

const ready = ref(false);
Promise.allSettled([]).then(() => (ready.value = true));

useServicesStore();
useLocationRoute();

onMounted(() => {
  if (!isPluginMode) document.body.classList.add('new-light-mode'); // For now, dont suppport themes
});
</script>

<style scoped>
.app-container {
  background: var(--primary-bgcolor);
}
</style>
