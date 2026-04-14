<template>
  <article class="clients-container">
    <div v-if="isLoading" class="flex justify-content-start align-items-center w-full mt-8">
      <!-- <ProgressSpinner style="height: 5rem; width: 5rem" /> -->
      <ThinfinitySpinner />
    </div>
    <template v-else>
      <div class="clients-header m-2">
        <div>
          <Tabs v-if="modelItems?.length > 0" :tabs="modelItems" v-model:activeIndex="activeIndex"> </Tabs>
        </div>
        <div class="flex justify-content-end">
          <PrimeButton :label="$t('clientList.addClient')" @click="addClient" />
          <PrimeButton
            @click="openMenu"
            :disabled="selectedClients.length === 0"
            icon="tws-v-ellipsis-filled text-lg"
            class="context-menu-button text-center p-0 m-0 w-auto text-base p-button-link"
          ></PrimeButton>
        </div>
      </div>
      <div v-if="modelItems?.length > 0" class="clients-content m-2 overflow-y-auto overflow-x-hidden flex-1">
        <ModelListTable
          :key="modelItems[activeIndex]?.value"
          v-model:selectedClients="selectedClients"
          :modelId="+modelItems[activeIndex]?.value"
          :manyItemsLoading="manyItemsLoading"
          :optimisticDeployments="optimisticDeployments"
          @optimistcClear="optimistcClear"
          v-model:pendingItems="pendingItems"
        />
      </div>
    </template>
  </article>
  <PrimeMenu ref="contextMenu" @hide="onContextMenuHide" :model="menuItemsMany" :popup="true" />
  <DeploymentDialog ref="deploymentDialog" />
  <TConfirmDialog
    :breakpoints="{ '1980px': '30vw', '1280px': '40vw', '960px': '50vw', '640px': '98vw' }"
    :style="{ width: '50vw' }"
  />
</template>

<script setup>
import { computed, nextTick, ref, watch, onMounted } from 'vue';
import { useGetModels } from '@queries/vdi/models';
// import { useGetInstances } from '@queries/vdi/instances';
// import { useGetDeployments } from '@queries/vdi/deploymen
// import ProgressSpinner from 'primevue/progressspinner';
import TConfirmDialog from '@components/Dialogs/TConfirmDialog/TConfirmDialog.vue';
import Tabs from '@aaas_components/TabPillMenu.vue';
import i18n from '@lang';
import { useUserInfoQuery } from '@queries/auth';
import { useDeployMutation } from '@queries/vdi/models';
import PrimeButton from 'primevue/button';
import PrimeMenu from 'primevue/menu';
import DeploymentDialog, { actions as deploymentDialogActions } from '../../components/DeploymentDialog.vue';
import ModelListTable from './components/ModelListTable.vue';
import { getUniqueKey } from './utils';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from '@components/Dialogs/TConfirmDialog/useConfirm';
import { /* useGetInstances, */ useRunActionMutation, useRemoveInstance } from '@queries/vdi/instances';
import { simpleStatuses, actions } from '@services/vdi/instances';
import { useDeleteDeploymentMutation, useGetDeployments } from '@queries/vdi/deployments';
import { useLocalStorage } from '@vueuse/core';

const currentModelId = useLocalStorage('Thinfinity_AaaS_currentModelId', null);
const activeIndex = ref(0);

const tconfirm = useConfirm();
const toast = useToast();

const { data: userInfo } = useUserInfoQuery();
const userName = computed(() => userInfo?.value?.username?.split('\\').at(-1));
const { mutateAsync: runActionMutate } = useRunActionMutation();
const { mutateAsync: removeDeploymentMutation } = useDeleteDeploymentMutation();
// const { mutateAsync: detachInstanceMutate } = useRemoveInstance(); // TODO: detach failed

const $t = i18n.global.t;

const manyItemsLoading = ref([]);

const selectedClients = ref([]);
const { data: models, isLoading } = useGetModels(
  { includeDeleted: true },
  {
    key: ['vdi-home'],
    cacheTime: 0,
  }
);

const contextMenu = ref(null);
const openMenu = ($event, items) => {
  nextTick(() => {
    contextMenu?.value?.show($event);
  });

  $event.stopPropagation();
};
const onContextMenuHide = () => {
  // console.log('context menu hidden');
  // contextMenu.value?.show($event);
};

function pruneMatchingItems(items, action) {
  let actionDesiredStatus = '';
  switch (action) {
    case actions.START:
      actionDesiredStatus = simpleStatuses.ACTIVE;
      break;
    case actions.STOP:
      actionDesiredStatus = simpleStatuses.INACTIVE;
      break;
    default:
      break;
  }
  return items.filter((item) => item.simpleStatus !== actionDesiredStatus) || [];
}
// const isSelectable = (item) => {
//   // Do not allow selecting deployments or pending rows
//   const isDeployment = !item.deploymentId;
//   if (isDeployment) return false;
//   item.actionPending || item.status === deploymentStatuses.STARTED
// };

const pendingItems = ref(false);

function handleMany(action) {
  if (selectedClients.value.length === 0) return;

  const actionLabel = $t(`common.${action}`);

  tconfirm.require({
    header: $t(`sendCommand.header`, { action: actionLabel }),
    message: $t(`sendCommand.message`, {
      action: actionLabel,
      count: selectedClients.value.length,
      name: selectedClients.value.map((item) => item.name).join(', '),
    }),
    acceptLabel: $t(`common.yes`),
    rejectLabel: $t(`common.no`),
    icon: 'tws-alert-circled-filled',

    accept: async () => {
      const itemsToAction = pruneMatchingItems(selectedClients.value, action);
      const reqs = itemsToAction.map((item) => runActionMutate({ id: item.id, action }));
      await Promise.allSettled(reqs);

      manyItemsLoading.value = [...manyItemsLoading.value, ...itemsToAction.map((item) => item.id)]; // for loading state on many items

      // handle error/success messages
      const hasErrors = reqs.some((req) => {
        if (req.status === 'rejected') {
          return true;
        }
      });
      // console.log('hasErrors: ', hasErrors, reqs);
      if (hasErrors) {
        toast.add({
          group: 'instances',
          severity: 'error',
          summary: $t('common.error'),
          detail: $t('sendCommand.errorDetail'),
          life: 3000,
        });
      } else {
        toast.add({
          group: 'instances',
          severity: 'success',
          summary: $t('common.success'),
          detail: $t('sendCommand.successDetail'),
          life: 3000,
        });
      }
    },
    reject: () => {},
  });
}
const menuItemsMany = computed(() => {
  const hasActive = selectedClients.value.some((item) => item.simpleStatus === simpleStatuses.ACTIVE);
  const hasInactive = selectedClients.value.some((item) => item.simpleStatus === simpleStatuses.INACTIVE);
  const items = [
    {
      label: $t('common.remove'),
      icon: 'tws-trash',
      command: () => {
        tconfirm.require({
          header: $t(`sendCommand.headerRemove`, { count: selectedClients.value.length }),
          message: $t(`sendCommand.messageRemove`, {
            name: selectedClients.value.map((item) => item.name).join(', '),
            count: selectedClients.value.length,
          }),
          acceptLabel: $t(`common.yes`),
          rejectLabel: $t(`common.no`),
          icon: 'tws-alert-circled-filled',
          accept: async () => {
            console.log('accept');
            // selectedClients.value = selectedClients.value.filter((client) => client !== item.name);
            // /* const result =  */ await runActionMutate({ id: item.id });
            manyItemsLoading.value = [...manyItemsLoading.value, ...selectedClients.value]; // for loading state on many items
            const reqs = selectedClients.value.map((item) => removeDeploymentMutation(item.deploymentId));
            // loadingStateInstances.value.push(contextItem.value.id);
            // removeMutate({ id: contextItem.value.id });
          },
          reject: () => {},
        });
      },
    },
  ];
  if (hasInactive) {
    items.push({
      label: $t('common.start'),
      icon: 'tws-play-circled-filled',
      command: () => handleMany(actions.START),
    });
  }
  if (hasActive) {
    items.push({
      label: $t('common.stop'),
      icon: 'tws-stop-c-f-b',
      command: () => handleMany(actions.STOP),
    });
  }
  return items;
});

watch(activeIndex, () => {
  selectedClients.value = [];
});

const deploymentDialog = ref();
const { mutateAsync: createDeployment } = useDeployMutation();

const modelItems = computed(() => {
  let items = [];
  if (isLoading.value || !models.value?.length) return items;

  const itemsWithUniqueName = models.value.reduce((acc, model) => {
    let [usr, nameFromFriendlyName] = model.friendlyName.split('-');
    if (!usr || userName.value !== usr) return acc; // display only models for the current user matching on friendly name
    const name = model.desc || nameFromFriendlyName;
    const nameKey = getUniqueKey(name, acc);

    if (nameKey) {
      acc[nameKey] = model;
    }
    return acc;
  }, {});
  items = Object.keys(itemsWithUniqueName).map((key) => ({
    label: key,
    value: itemsWithUniqueName[key].id,
    data: itemsWithUniqueName[key],
  }));
  return items;
});

const optimisticDeployments = ref([]);

const addClient = async () => {
  const currentModelId = modelItems.value?.[activeIndex.value]?.value;
  if (!currentModelId || !deploymentDialog.value?.show) return;
  const { action, id, count, name, parameters } = await deploymentDialog.value.show({ modelId: currentModelId });
  if (action === deploymentDialogActions.DEPLOY) {
    try {
      await createDeployment({ id, count, name, parameters });
      toast.add({
        group: 'instances',
        severity: 'info',
        detail: $t('deployDialog.actionSent'),
        life: 3000,
      });
      optimisticDeployments.value.push({ name, modelId: currentModelId });
    } catch (error) {
      toast.add({
        group: 'instances',
        severity: 'error',
        detail: $t('deployDialog.actionFailed'),
        life: 3000,
      });
    }
  }
};

const optimistcClear = () => {
  optimisticDeployments.value = [];
};

// REMEMBER LAST TAB ON LOCAL STORAGE
watch(
  modelItems,
  (modelItems) => {
    if (!modelItems.length) return;

    if (currentModelId.value) {
      const index = modelItems.findIndex((item) => String(item.value) === String(currentModelId.value));
      if (index !== -1) {
        activeIndex.value = index;
      }
    }
  },
  { immediate: true }
);

watch(activeIndex, (newVal) => {
  currentModelId.value = modelItems.value?.[newVal]?.value;
});
</script>

<style scoped lang="scss">
:root {
  --client-header-height: 20%;
}
.clients-container {
  // flex flex-1 flex-column h-full
  display: flex;
  flex-direction: column;
  height: calc(100% - var(--aaas-footer-height));
  margin: 0;
  .clients-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: var(--client-header-height);
  }

  .clients-content {
    // background: gold;
    height: calc(100% - var(--client-header-height));
  }

  .context-menu-button {
    background: none;
  }
}
</style>
