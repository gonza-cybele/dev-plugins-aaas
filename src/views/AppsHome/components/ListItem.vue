<template>
  <li class="client-list-item" :style="{ borderColor: borderColor, backgroundColor: backgroundColor }">
    <div class="client-list-item__content">
      <slot name="content"></slot>
      <div v-tooltip.top="statusMessage" :class="`client-list-item__status ${statusIconClass}`"></div>
      <div class="client-list-item__name">
        <slot name="nameSlot">{{ name }}</slot>
      </div>
    </div>
    <div class="client-list-item__actions">
      <slot name="statusMessage">
        <span v-if="pending" class="font-italic text-xs mr-2 cursor-wait">{{ statusMessage + '...' }}</span>
      </slot>
      <ProgressSpinner
        class="cursor-wait"
        role="status"
        aria-label="Loading"
        v-if="pending"
        style="height: 1.25rem; width: 1.25rem; text-align: center; margin-right: 0.25rem"
      />
      <slot v-else name="actions"></slot>
    </div>
  </li>
</template>

<script setup>
//import { ref } from 'vue';
import { computed } from 'vue';
import i18n from '@lang';
import ProgressSpinner from 'primevue/progressspinner';
import { simpleStatuses } from '@services/vdi/instances';

const $t = i18n.global.t;

const props = defineProps({
  name: { type: String, required: true },
  pending: { type: Boolean, default: false },
  simpleStatus: { type: String, required: true, default: simpleStatuses.INACTIVE },
  customStatus: { type: String, required: false, default: null },
  borderColor: { type: String, default: 'var(--light-border-color)' },
  backgroundColor: { type: String, default: 'var(--toolbar-bgcolor)' },
});

const statusMessage = computed(() => {
  if (props.customStatus) {
    return props.customStatus;
  }
  if (props.pending) {
    return simpleStatuses.ACTIVE === props.simpleStatus
      ? $t('common.stopping')
      : simpleStatuses.INACTIVE === props.simpleStatus
      ? $t('common.starting')
      : $t('clientList.loading');
  }
  return props.simpleStatus === simpleStatuses.ACTIVE
    ? $t('clientList.on')
    : props.simpleStatus === simpleStatuses.INACTIVE
    ? $t('clientList.off')
    : $t('clientList.loading');
});
const statusIconClass = computed(
  () =>
    `client-list-item__status--${
      props.pending
        ? 'loading'
        : simpleStatuses.ACTIVE === props.simpleStatus
        ? 'on'
        : simpleStatuses.INACTIVE === props.simpleStatus
        ? 'off'
        : 'loading'
    }`
);
</script>

<style scoped lang="scss">
.client-list-item {
  display: flex;
  justify-content: space-between;
  border: solid 1px var(--light-border-color);
  background: var(--toolbar-bgcolor);
  border-radius: 0.25rem;
  width: 100%;
  list-style: none;
  padding: 0.5rem;
  margin-bottom: 0.75rem;
  input {
    margin-right: 1rem;
  }
  &__content {
    display: flex;
    align-items: center;
  }
  &__actions {
    display: flex;
    align-items: center;
    button {
      background: none;
    }
  }
  &__status {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background-color: var(--danger);
    cursor: help;
    &--on {
      background-color: var(--allowed);
    }
    &--off {
      background-color: var(--danger);
    }
    &--loading {
      background-color: var(--alert);
    }
  }
  &__name {
    margin-left: 1rem;
  }
}
</style>
