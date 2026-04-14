<template>
  <div class="aaas-layout flex flex-column h-full w-full">
    <!-- v-if="!fullscreen" -->
    <!-- <Button label="Login" @click="login" /> -->
    <TopBar v-if="!isPluginMode" class="topbar"></TopBar>
    <main class="main-container flex flex-column flex-1 min-h-0 w-full overflow-hidden">
      <!-- flex-1 min-h-0 makes it take all available space -->
      <!-- overflow-hidden prevents content from expanding beyond viewport -->
      <RouterView></RouterView>
    </main>
    <footer class="app-footer" v-if="showFooter">
      <small>
        <!-- <span class="hiddenThin">{{ PostMetaDataVariables.productName }} v{{ PostMetaDataVariables.productVersion }}.&nbsp;</span> -->
        {{ $t(`common.allRightsReserved`) }}
        <a href="https://www.cybelesoft.com/?utm_source=TRDS&utm_medium=Link&utm_campaign=Home" target="_blank"
          >Cybele Software, Inc.</a
        >
      </small>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import TopBar from '@aaas_components/TopBar.vue';
import i18n from '@lang';

const isPluginMode = import.meta.env.VITE_PLUGIN_MODE === 'true';

const $t = i18n.global.t;
const showFooter = ref(!isPluginMode);
</script>

<style scoped lang="scss">
.aaas-layout {
  background: var(--primary-bgcolor, #ffffff);
}

.topbar {
  // height: 4.5rem;
  height: var(--aaas-topbar-height);
  flex-shrink: 0; // Prevent topbar from shrinking
}
main {
  // margin: 0.5rem;
  // height: var(--client-content-height);
}
footer {
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--aaas-footer-height);
}
</style>
