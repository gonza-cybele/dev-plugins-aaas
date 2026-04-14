<template>
  <div v-if="isLoading" class="flex justify-content-center align-items-center w-full mt-8">
    <!-- <ProgressSpinner style="height: 5rem; width: 5rem; text-align: center" /> -->
    <ThinfinitySpinner />
  </div>
  <Message v-else-if="allItems.length === 0" :closable="false" class="m-2">
    {{ $t('clientList.noInstancesFound') }}
  </Message>
  <DataTable
    v-else
    class="custom-scrollbars p-datatable-sm booking-dataTable-list m-2"
    :scrollable="true"
    :value="allItems"
    responsiveLayout="scroll"
    selectionMode="multiple"
    dataKey="id"
    :rowSelectable="isSelectable"
    :select-all="selectAll"
    @select-all-change="onSelectAllChange"
  >
    <template #empty>
      <p class="p-0 m-0 text-center block">{{ $t('clientList.noInstancesFound') }}</p>
    </template>
    <Column selectionMode="multiple" :headerStyle="{ width: '3rem' }" :selectable="isSelectable">
      <template #body="slotProps">
        <Checkbox
          class="flex align-items-center"
          v-model="selectedItems"
          :inputId="slotProps.data.id"
          name="checkbox"
          :value="slotProps.data.id"
          :disabled="!isSelectable(slotProps.data)"
          style="position: relative; top: -0.25rem"
        />
      </template>
    </Column>
    <Column field="name">
      <template #header
        ><b>{{ $t('common.name') }}</b></template
      >
      <template #body="slotProps">
        <div class="flex align-items-center">
          <div
            v-tooltip.top="getRowStatusMessage(slotProps.data)"
            :class="`client-list-item__status ${getStatusIconClass(slotProps.data)}`"
          ></div>
          <span class="ml-2">{{ slotProps.data.name }}</span>
        </div>
      </template>
    </Column>
    <Column field="actions" :headerStyle="{ width: 'auto' }">
      <template #header
        ><b class="w-full flex justify-content-end mr-2">{{ $t('common.actions') }}</b></template
      >
      <template #body="slotProps">
        <div class="flex align-items-center justify-content-end column-actions">
          <!-- INSTANCES -->
          <template v-if="isInstance(slotProps.data)">
            <template v-if="!checkLoadingState(slotProps.data)">
              <PrimeButton
                @click="toggleItemStart(slotProps.data)"
                :disabled="checkLoadingState(slotProps.data)"
                :icon="`${
                  slotProps.data.simpleStatus === simpleStatuses.ACTIVE ? 'tws-stop-c-f-b' : 'tws-play-circled-filled'
                } text-lg`"
                v-tooltip.left="
                  slotProps.data.simpleStatus === simpleStatuses.ACTIVE ? $t('common.stop') : $t('common.start')
                "
                class="action-button p-0 m-0 w-auto text-base p-button-link mr-2"
              />
              <PrimeButton
                @click="onItemContextMenu($event, slotProps.data)"
                :disabled="false"
                icon="tws-v-ellipsis-filled text-lg"
                class="action-button p-0 m-0 w-auto text-base p-button-link"
              />
            </template>
            <template v-else>
              <div class="flex align-items-center">
                <span class="font-italic text-xs mr-2 cursor-wait">{{ getRowStatusLabel(slotProps.data) }}</span>
                <ProgressSpinner
                  class="cursor-wait ml-2"
                  role="status"
                  aria-label="Loading"
                  style="height: 1.25rem; width: 1.25rem; text-align: center"
                />
              </div>
            </template>
          </template>
          <!-- DEPLOYMENTS -->
          <template v-else>
            <template v-if="isFailedDeployment(slotProps.data)">
              <div class="flex align-items-center">
                <span class="font-italic text-xs mx-2">{{ $t('deployDialog.failedToDeploy') }}</span>
                <i class="tws-alert-circled-filled alert-error"></i>
                <PrimeButton
                  @click="onItemContextMenu($event, slotProps.data)"
                  :disabled="false"
                  icon="tws-v-ellipsis-filled text-lg"
                  class="action-button p-0 m-0 w-auto text-base p-button-link"
                />
              </div>
            </template>
            <template v-else>
              <div class="flex align-items-center">
                <span class="font-italic text-xs mr-2 cursor-wait">{{ getRowStatusLabel(slotProps.data) }}</span>
                <ProgressSpinner
                  class="cursor-wait ml-2"
                  role="status"
                  aria-label="Loading"
                  style="height: 1.25rem; width: 1.25rem; text-align: center"
                />
              </div>
            </template>
          </template>
        </div>
      </template>
    </Column>
  </DataTable>

  <PrimeMenu ref="itemContextMenu" @hide="onContextItemMenuHide" :model="menuItems" :popup="true" />
</template>

<script setup>
import { computed, nextTick, ref, watch, watchEffect } from 'vue';
import { useVModel } from '@vueuse/core';
import { useConfirm } from '@components/Dialogs/TConfirmDialog/useConfirm';
import ThinfinitySpinner from '@components/ThinfinitySpinner/ThinfinitySpinner.vue';
import i18n from '@lang';
import useRefetchIntervalComponentState from '@queries/utils/useRefetchIntervalComponentState';
import { useGetDeployments } from '@queries/vdi/deployments';
import { useDeleteDeploymentMutation } from '@queries/vdi/deployments';
import { useGetInstances, useRunActionMutation } from '@queries/vdi/instances';
import {
  deploymentActions,
  deploymentStatuses,
  // deploymentActionsString,
  // deploymentStatusesString,
} from '@services/vdi/deployments';
import { actions, simpleStatuses } from '@services/vdi/instances';
// import useScreenSize from '@utils/useScreenSize';
import PrimeButton from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import PrimeMenu from 'primevue/menu';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { difference } from 'lodash';

const $t = i18n.global.t;

const selectAll = ref(false);
const selectedItems = ref([]);

const props = defineProps({
  modelId: { type: Number, required: true },
  selectedClients: { type: Array, required: true },
  manyItemsLoading: { type: Array, required: true },
  optimisticDeployments: { type: Array, default: () => [] },
  pendingItems: { type: Array, default: () => [] },
});
const deployments = computed(() => deploymentsData.value?.items ?? []);
const emit = defineEmits(['update:selectedClients', 'optimistcClear', 'update:pendingItems']);
const selectedClients = useVModel(props, 'selectedClients', emit);
const pendingItems = useVModel(props, 'pendingItems', emit);

const loadingStateInstances = ref([]); // To provide feedback and block actions while action is pending
const deploymentsInProgress = computed(
  () => deployments.value?.filter((deployment) => deployment.status === deploymentStatuses.STARTED) ?? []
);
const deploymentsFailed = computed(
  () => deployments.value?.filter((deployment) => deployment.status === deploymentStatuses.ERROR) ?? []
);
const currentDeployments = computed(() => [...deploymentsInProgress.value, ...deploymentsFailed.value] ?? []);

const modelItems = computed(() => {
  return (
    instances.value?.items?.filter((instance) => {
      return !currentDeployments.value.some((deployment) => deployment.id === instance.deploymentId);
    }) ?? []
  );
});

const optimisticDeploymentsList = computed(() =>
  props.optimisticDeployments.filter(
    (deployment) =>
      !currentDeployments.value.some((d) => d.name === deployment.name) && deployment.modelId === props.modelId
  )
);

const tconfirm = useConfirm();

function checkLoadingState(item) {
  if (!item) return false;
  const itemDeployment = deployments.value?.find(({ id }) => id === item.deploymentId);
  return (
    item.actionPending ||
    loadingStateInstances.value.includes(item.id) ||
    itemDeployment?.status === deploymentStatuses.STARTED
  );
}

const lastIdInstances = ref(0);
const {
  data: instances,
  isFetching: isFetchingInstances,
  isLoading: isLoadingInstances,
  // refetch: refetchInstances,
} = useGetInstances(
  { modelId: computed(() => props.modelId), lastId: computed(() => lastIdInstances.value) },
  { ...useRefetchIntervalComponentState({ interval: 15 * 1000, background: true }) }
);
const lastIdDeployments = ref(0);
const {
  data: deploymentsData,
  isFetching: isFetchingDeployments,
  isLoading: isLoadingDeployments,
  // refetch: refetchDeployments,
} = useGetDeployments(
  { modelId: computed(() => props.modelId), lastId: computed(() => lastIdDeployments.value) },
  {
    ...useRefetchIntervalComponentState({ interval: 15 * 1000, background: true }),
  }
);
watch(isFetchingInstances, (fetching) => {
  if (!fetching) {
    lastIdInstances.value = instances.value?.lastId ?? 0;
  }
});
watch(isFetchingDeployments, (fetching) => {
  if (!fetching) {
    lastIdDeployments.value = deploymentsData.value?.lastId ?? 0;
  }
});
watch(
  () => props.modelId,
  (newModelId, oldModelId) => {
    if (newModelId === oldModelId) return;
    lastIdInstances.value = 0;
    lastIdDeployments.value = 0;
  },
  { immediate: true }
);

const isLoading = computed(() => isLoadingInstances.value || isLoadingDeployments.value);

const { mutateAsync: runActionMutate } = useRunActionMutation();
const { mutateAsync: removeDeploymentMutation } = useDeleteDeploymentMutation();
// const { mutateAsync: detachInstanceMutate } = useRemoveInstance(); //TODO: detach instances

const allItems = computed(() => [
  ...optimisticDeploymentsList.value,
  ...deploymentsInProgress.value,
  ...deploymentsFailed.value,
  ...modelItems.value,
]);
watch(
  [allItems, loadingStateInstances],
  ([items, loadingStateInstances]) => {
    const pending = items.some((item) => checkLoadingState(item));

    pendingItems.value = pending || loadingStateInstances.length > 0;
  },
  { deep: true }
);
async function toggleItemStart(item) {
  // debugger;
  const action = item.simpleStatus === simpleStatuses.ACTIVE ? actions.STOP : actions.START;
  const actionLabel = $t(`common.${action}`);
  // console.log({ action: actionLabel, name: item.name });
  tconfirm.require({
    message: $t(`sendCommand.message`, { action: actionLabel, name: item.name, count: 1 }),
    header: $t(`sendCommand.header`, { action: actionLabel }),
    acceptLabel: $t(`common.yes`),
    rejectLabel: $t(`common.no`),
    icon: 'tws-alert-circled-filled',
    accept: async () => {
      // selectedClients.value = selectedClients.value.filter((client) => client !== item.name);
      /* const result =  */ await runActionMutate({ id: item.id, action });
      loadingStateInstances.value.push(item.id);
    },
    reject: () => {},
  });
}
const contextItem = ref(null);
const itemContextMenu = ref();
const onItemContextMenu = ($event, item) => {
  if (itemContextMenu?.value && itemContextMenu.value?.id !== item.id) {
    itemContextMenu.value.hide();
  }
  contextItem.value = item;
  nextTick(() => {
    itemContextMenu.value?.show($event, item);
  });

  $event.stopPropagation();
};
const onContextItemMenuHide = () => {};
const menuItems = ref([
  {
    label: $t('common.remove'),
    icon: 'tws-trash',
    command: () => {
      // if() should detach?
      const isDeployment = !contextItem.value?.deploymentId;
      const deploymentId = isDeployment ? contextItem.value?.id : contextItem.value?.deploymentId;
      const ownId = contextItem.value?.id;
      // const deploymentId = contextItem.value?.deploymentId ||;
      tconfirm.require({
        header: $t(`sendCommand.headerRemove`),
        message: $t(`sendCommand.messageRemove`, { name: contextItem.value.name }),
        acceptLabel: $t(`common.yes`),
        rejectLabel: $t(`common.no`),
        icon: 'tws-alert-circled-filled',
        accept: async () => {
          // selectedClients.value = selectedClients.value.filter((client) => client !== item.name);
          // /* const result =  */ await runActionMutate({ id: item.id });
          loadingStateInstances.value.push(ownId);
          removeDeploymentMutation(deploymentId);
        },
        reject: () => {},
      });
    },
  },
]);

watch(isFetchingInstances, () => {
  setTimeout(() => {
    loadingStateInstances.value = [];
  }, 1000);
});

watch(isFetchingDeployments, () => {
  setTimeout(() => {
    emit('optimistcClear');
  }, 1000);
});

watch(
  () => props.manyItemsLoading,
  (val) => {
    if (val.length > 0) loadingStateInstances.value = val;
  }
);

const getStatusMessage = (item) => {
  const simpleStatus = item.simpleStatus;
  const pending = checkLoadingState(item);

  switch (simpleStatus) {
    case simpleStatuses.ACTIVE:
      return pending ? $t('common.stopping') : $t('clientList.on');
    case simpleStatuses.INACTIVE:
      return pending ? $t('common.starting') : $t('clientList.off');
    default:
      return $t('clientList.loading');
  }
};

const isDeployment = (item) => !item?.deploymentId;
const isInstance = (item) => !!item?.deploymentId;
const isOptimistic = (item) => isDeployment(item) && item?.status === undefined;
const isDeploymentInProgress = (item) => isDeployment(item) && item?.status === deploymentStatuses.STARTED;
const isFailedDeployment = (item) => isDeployment(item) && item?.status === deploymentStatuses.ERROR;

const isSelectable = (item) => {
  // Do not allow selecting deployments or pending rows
  if (isDeployment(item)) return false;
  return !checkLoadingState(item);
};

const activeItems = computed(() => {
  return allItems.value?.filter((t) => isSelectable(t)).map((k) => k.id) ?? [];
});

const isSelectAllDisabled = computed(() => {
  return activeItems.value.length === 0;
});

const onSelectAllChange = (event) => {
  // Handle both DataTable event (event.checked) and Checkbox change (event can be boolean or event object)
  const checked = event?.checked !== undefined ? event.checked : event;
  selectAll.value = checked;
  if (checked) {
    selectedItems.value = activeItems.value;
  } else {
    selectedItems.value = [];
  }
};

watchEffect(() => {
  const validSelected = selectedItems.value.filter((t) => activeItems.value.includes(t));
  selectedItems.value = validSelected;
  if (!activeItems.value.length) return (selectAll.value = false);
  selectAll.value = difference(activeItems.value, validSelected).length === 0;
});

// Sync selectedItems (IDs) with selectedClients (full objects)
watch(
  selectedItems,
  (newSelectedIds) => {
    const selectedObjects = newSelectedIds.map((id) => allItems.value.find((item) => item.id === id)).filter(Boolean);
    selectedClients.value = selectedObjects;
  },
  { immediate: true }
);

// Sync selectedClients (full objects) back to selectedItems (IDs) when changed externally
watch(
  () => props.selectedClients,
  (newSelectedClients) => {
    const newSelectedIds = newSelectedClients.map((item) => item.id).filter(Boolean);
    const validIds = newSelectedIds.filter((id) => activeItems.value.includes(id));
    if (JSON.stringify(validIds.sort()) !== JSON.stringify(selectedItems.value.sort())) {
      selectedItems.value = validIds;
    }
  },
  { deep: true }
);

const getRowStatusMessage = (item) => {
  if (isOptimistic(item)) return $t('deployDialog.deploying');
  if (isDeploymentInProgress(item)) {
    return item.lastAction === deploymentActions.CREATE ? $t('deployDialog.deploying') : $t('deployDialog.destroying');
  }
  if (isFailedDeployment(item)) {
    return $t('deployDialog.failedToDeploy');
  }
  return getStatusMessage(item);
};

const isPendingRow = (item) => {
  if (!item) return false;
  if (isOptimistic(item)) return true;
  if (isDeploymentInProgress(item)) return true;
  if (isInstance(item)) return checkLoadingState(item);
  return false;
};
const getRowStatusLabel = (item) => {
  const base = getRowStatusMessage(item);
  return isPendingRow(item) ? `${base}...` : base;
};

const getStatusIconClass = (item) => {
  if (isPendingRow(item)) return 'client-list-item__status--loading';
  if (isFailedDeployment(item)) return 'client-list-item__status--off';

  return `client-list-item__status--${
    item.simpleStatus === simpleStatuses.ACTIVE
      ? 'on'
      : item.simpleStatus === simpleStatuses.INACTIVE
      ? 'off'
      : 'loading'
  }`;
};
</script>

<style scoped lang="scss">
.models-list {
  // background-color: green;
  padding: 0;
  margin: 0 0.5rem;
}
.action-button {
  background: none;
}
.client-list-item__status {
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
</style>
