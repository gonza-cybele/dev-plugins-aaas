<template>
  <Dialog
    :modal="true"
    v-model:visible="dialogVisible"
    :header="$t(`deployDialog.title`)"
    :showHeader="true"
    :closeOnEscape="true"
    :closable="true"
    :style="{ width: '28rem' }"
    contentClass="flex flex-column"
    @hide="onHide()"
  >
    <template #header>
      <span class="p-dialog-title">{{ $t(`deployDialog.title`) }}</span>
    </template>

    <div class="flex flex-column flex-1 gap-3">
      <InputTextLabel
        :label="$t(`deployDialog.name`)"
        name="name"
        v-model="formData.name"
        :vuelidate="v$.formData.name"
        :submitted="submitted"
        :autoFocus="false"
      />
      <InputTextLabel
        :label="$t(`deployDialog.email`)"
        name="email"
        v-model="formData.email"
        :vuelidate="v$.formData.email"
        :submitted="submitted"
        :autoFocus="false"
      />
      <InputTextLabel
        :label="$t(`deployDialog.serialNumber`)"
        name="serialNumber"
        v-model="formData.serialNumber"
        :vuelidate="v$.formData.serialNumber"
        :submitted="submitted"
        :autoFocus="false"
      />
    </div>
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button
          style="width: 6.5rem"
          class="p-button-base"
          :label="$t(`deployDialog.deploy`)"
          @click="deploy()"
        ></Button>
        <Button
          style="width: 6.5rem"
          class="p-button-secondary p-button-base"
          :label="$t('deployDialog.cancel')"
          @click="cancel()"
        ></Button>
      </div>
    </template>
  </Dialog>
</template>

<script>
export const actions = Object.freeze({
  DEPLOY: 'DEPLOY',
  CANCEL: 'CANCEL',
});

const DEFAULT_DEPLOY_COUNT = 1;
</script>

<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import useDialog from '@utils/useDialog';
import { ref } from 'vue';
import i18n from '@lang';
import InputTextLabel from '@components/Editors/Form/InputTextLabel.vue';
import useVuelidate from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';

const $t = i18n.global.t;

const emit = defineEmits(['close', 'cancel']);
const { show, emitResponse, showDialog: dialogVisible } = useDialog(emit);

const modelId = ref();

const formData = ref({
  name: '',
  email: '',
  serialNumber: '',
});

const submitted = ref(false);

const rules = {
  formData: {
    name: { required },
    email: { required, email },
    serialNumber: { required },
  },
};

const v$ = useVuelidate(rules, { formData });

const reset = () => {
  modelId.value = null;
  formData.value = {
    name: '',
    email: '',
    serialNumber: '',
  };
  submitted.value = false;
  v$.value.$reset();
};

const onHide = () => {
  reset();
};

const deploy = async () => {
  submitted.value = true;

  const isValid = await v$.value.$validate();

  if (!isValid) {
    return;
  }

  const parameters = {};

  if (formData.value.email) {
    parameters.email = formData.value.email;
  }

  if (formData.value.serialNumber) {
    parameters.serialNumber = formData.value.serialNumber;
  }

  emitResponse(
    {
      action: actions.DEPLOY,
      id: modelId.value,
      name: formData.value.name,
      count: DEFAULT_DEPLOY_COUNT,
      parameters,
    },
    true,
    'close'
  );
};

const cancel = () => {
  emitResponse({ action: actions.CANCEL }, true, 'cancel');
};

const _show = ({ modelId: mId = null } = {}) => {
  modelId.value = mId;
  return show();
};

defineExpose({
  show: _show,
});
</script>
