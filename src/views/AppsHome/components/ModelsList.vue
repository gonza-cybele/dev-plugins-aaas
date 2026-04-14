<!-- ALTERNATIVE LIST VIEW -->
<template>
  <div v-if="isLoading" class="flex justify-content-center align-items-center w-full mt-8">
    <!-- <ProgressSpinner style="height: 5rem; width: 5rem; text-align: center" /> -->
    <ThinfinitySpinner />
  </div>
  <ul v-else class="models-list">
    <Message v-if="isEmptyList" :closable="false">
      {{ $t('clientList.noInstancesFound') }}
    </Message>
    <!-- DEPLOYMENTS ----------------------------------->
    <!-- OPTIMISTIC DEPLOYMENTS ----------------------->
    <ListItem
      v-for="item in optimisticDeploymentsList"
      :key="item.name"
      :name="item.name"
      :customStatus="$t('deployDialog.deploying')"
      :pending="true"
    >
      <template #content>
        <Checkbox name="id" :value="item" class="mr-2" :disabled="true" />
      </template>
      <template #statusMessage>
        <span class="font-italic text-xs mr-2 cursor-wait">{{ $t('deployDialog.deploying') }}...</span>
      </template>
    </ListItem>
    <!-- IN PROGRESS DEPLOYMENTS ----------------------->
    <ListItem
      v-for="item in deploymentsInProgress"
      :key="item.id"
      :name="item.name"
      :customStatus="
        item.lastAction === deploymentActions.CREATE ? $t('deployDialog.deploying') : $t('deployDialog.destroying')
      "
      :pending="true"
    >
      <template #content><Checkbox name="id" :value="item" class="mr-2" :disabled="true" /></template>
      <template #statusMessage>
        <span class="font-italic text-xs mr-2 cursor-wait"
          >{{
            item.lastAction === deploymentActions.CREATE ? $t('deployDialog.deploying') : $t('deployDialog.destroying')
          }}...</span
        >
      </template>
    </ListItem>
    <!-- FAILED DEPLOYMENTS ----------------------->
    <ListItem
      v-for="item in deploymentsFailed"
      :key="item.id"
      :name="item.name"
      :customStatus="$t('common.failed')"
      borderColor="var(--danger)"
    >
      <template #content><Checkbox name="id" :value="item" class="mr-2" :disabled="true" /></template>
      <template #statusMessage>
        <span>
          <span class="font-italic text-xs mr-1">{{ $t('deployDialog.failedToDeploy') }}</span>
          <i class="tws-alert-circled-filled alert-error"></i>
        </span>
      </template>
      <template #actions>
        <PrimeButton
          @click="onItemContextMenu($event, item)"
          :disabled="false"
          icon="tws-v-ellipsis-filled text-lg"
          class="action-button p-0 m-0 w-auto text-base p-button-link"
        />
      </template>
    </ListItem>
    <!-- INSTANCES ----------------------->
    <ListItem
      v-for="item in modelItems"
      :key="item.name"
      :name="item.name"
      :simpleStatus="item.simpleStatus"
      :pending="checkLoadingState(item)"
    >
      <template #content>
        <Checkbox v-model="selectedClients" name="id" :value="item" class="mr-2" :disabled="checkLoadingState(item)" />
      </template>
      <template #actions>
        <PrimeButton
          @click="toggleItemStart(item)"
          :disabled="false"
          :icon="`${
            item.simpleStatus === simpleStatuses.ACTIVE ? 'tws-stop-c-f-b' : 'tws-play-circled-filled'
          } text-lg`"
          v-tooltip.left="item.simpleStatus === simpleStatuses.ACTIVE ? $t('common.stop') : $t('common.start')"
          class="action-button p-0 m-0 w-auto text-base p-button-link"
        />
        <PrimeButton
          @click="onItemContextMenu($event, item)"
          :disabled="false"
          icon="tws-v-ellipsis-filled text-lg"
          class="action-button p-0 m-0 w-auto text-base p-button-link"
        />
      </template>
    </ListItem>
  </ul>

  <PrimeMenu ref="itemContextMenu" @hide="onContextItemMenuHide" :model="menuItems" :popup="true" />
</template>

<!-- ALTERNATIVE LIST VIEW -->

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useVModel } from '@vueuse/core';
import { useConfirm } from '@components/Dialogs/TConfirmDialog/useConfirm';
import ThinfinitySpinner from '@components/ThinfinitySpinner/ThinfinitySpinner.vue';
import i18n from '@lang';
import useRefetchIntervalComponentState from '@queries/utils/useRefetchIntervalComponentState';
import { useGetDeployments } from '@queries/vdi/deployments';
import { useDeleteDeploymentMutation } from '@queries/vdi/deployments';
import { useGetInstances, useRemoveInstance, useRunActionMutation } from '@queries/vdi/instances';
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
import Message from 'primevue/message';
import ListItem from './ListItem.vue';

const props = defineProps({
  modelId: { type: Number, required: true },
  selectedClients: { type: Array, required: true },
  manyItemsLoading: { type: Array, required: true },
  optimisticDeployments: { type: Array, default: () => [] },
});
const deployments = computed(() => deploymentsData.value?.items ?? []);
const emit = defineEmits(['update:selectedClients', 'optimistcClear']);
const selectedClients = useVModel(props, 'selectedClients', emit);
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

const isEmptyList = computed(
  () =>
    modelItems.value.length +
      deploymentsInProgress.value.length +
      deploymentsFailed.value.length +
      optimisticDeploymentsList.value.length ===
    0
);

const tconfirm = useConfirm();
const $t = i18n.global.t;
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

async function toggleItemStart(item) {
  const action = item.simpleStatus === simpleStatuses.ACTIVE ? actions.STOP : actions.START;
  const actionLabel = $t(`common.${action}`);
  tconfirm.require({
    message: $t(`sendCommand.message`, 1, { action: actionLabel, name: item.name }),
    header: $t(`sendCommand.header`, { action: actionLabel }),
    acceptLabel: $t(`common.yes`),
    rejectLabel: $t(`common.no`),
    icon: 'tws-alert-circled-filled',
    accept: async () => {
      console.log('accept');
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
          console.log('accept');
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
</style>
