<template>
  <div v-if="showMobileTabs" class="tab-pill-menu-mobile">
    <Dropdown
      :options="tabs"
      v-model="selectedMobileTab"
      optionLabel="label"
      class="tab-pill-menu-mobile__dropdown"
      @change="onMobileTabChange"
    />
  </div>
  <TabMenu v-else class="tab-pill-menu" :model="tabs" v-model:activeIndex="activeTabIndex" />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import TabMenu from 'primevue/tabmenu';
import Dropdown from 'primevue/dropdown';
import useScreenSize from '@utils/useScreenSize';

const { isMobile } = useScreenSize();

// TODO: Eventually make dynamic space check instead of magic number
const showMobileTabs = computed(() => isMobile.value /*  || props.tabs.length > 6 */);

const props = defineProps({
  tabs: { type: Array, default: () => [] },
  activeIndex: { type: Number, default: 0 },
});

const emit = defineEmits(['update:activeIndex', 'tabChange']);

const activeTabIndex = computed({
  get: () => props.activeIndex,
  set: (val) => emit('update:activeIndex', val),
});
const selectedMobileTab = ref(props.tabs?.[props.activeIndex] || null);

// Sync mobile dropdown with active tab index
watch(activeTabIndex, (newIndex) => {
  if (props.tabs?.[newIndex]) {
    selectedMobileTab.value = props.tabs[newIndex];
  }
});

// Handle mobile tab change
const onMobileTabChange = (event) => {
  const selectedIndex = props.tabs.findIndex((tab) => tab === event.value);
  if (selectedIndex !== -1) {
    activeTabIndex.value = selectedIndex;
    emit('tabChange', { index: selectedIndex, value: event.value });
    // Handle command if exists
    if (event.value?.command) {
      event.value.command();
    }
  }
};
</script>

<style lang="scss">
.tab-pill-menu-mobile {
  padding: 0.1rem;
  margin: 0.1rem;
  &__dropdown {
    // width: 100%;
    border: solid 1px var(--light-border-color);
    border-radius: 0.25rem;
    background: var(--toolbar-bgcolor);
  }
}

.p-tabmenu.tab-pill-menu {
  //  margin-left: 1rem;
  .p-tabmenu-nav {
    border: solid 1px var(--light-border-color);
    border-top: none;
    padding: 0 0.25rem;
    border-radius: 0.25rem;
    margin: 0.1rem;
    // background: var(--primary-bgcolor);
    background: var(--toolbar-bgcolor);
    .p-tabmenuitem {
      padding: 0.25rem;
      .p-menuitem-link {
        border-radius: 0.25rem;
        background: none;
        padding: 0.25rem 0.5rem;
      }
      &:hover:not(.p-highlight) {
        .p-menuitem-link {
          // color: var(--button-txtcolor);
          background: var(--primary-bgcolor);
        }
      }
      &.p-highlight {
        border-bottom: none;
        box-shadow: none;
        .p-menuitem-link {
          background: var(--button-bgcolor);
          color: var(--button-txtcolor);
          border-bottom: none;
          box-shadow: none;
        }
      }
      &:not(.p-highlight):not(.p-disabled):hover {
        .p-menuitem-link {
          border-bottom: none;
          box-shadow: none;
        }
      }
    }
  }
}
// .p-menuitem-icon {}
// .p-menuitem-text {}
</style>
