<template>
  <header class="top-bar">
    <div class="top-bar__content">
      <div class="top-bar__logo">
        <div role="img" class="img" alt="Logo"></div>
      </div>
      <h1 class="top-bar__title" v-if="!isMobile">Application-as-a-Service</h1>
    </div>
    <div class="top-bar__user">
      <!-- <a href="#login">TO LOGIN</a> -->
      <PrimeButton v-if="!authenticated" class="ml-3 p-button-outline" :label="$t(`common.signIn`)" @click="signIn" />
      <Avatar v-else class="cursor-pointer" icon="tws-user-filled" shape="circle" @click="toggleMenu" />
    </div>
  </header>
  <PrimeMenu ref="userMenu" :model="userMenuItems" :popup="true" append-to=".top-bar" class="mt-2 shadow avatar-menu" />
</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import Avatar from 'primevue/avatar';
import useScreenSize from '@utils/useScreenSize';
import { useAuthenticated } from '@queries/auth';
import PrimeButton from 'primevue/button';
import i18n from '@lang';
import { useUserInfoQuery } from '@queries/auth';
import PrimeMenu from 'primevue/menu';
import { useSystemStore } from '@stores/system';
import basePath, { devBasePath } from '@utils/basePath';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();

const { logout: systemLogout } = useSystemStore();

const $t = i18n.global.t;

const { data: userInfo } = useUserInfoQuery();
const authenticated = useAuthenticated();
const { isMobile } = useScreenSize();

const userMenu = ref(null);

function signIn() {
  console.log('signIn');
  window.location.href = `${import.meta.env.DEV ? devBasePath : basePath}?signin`;
}

const toggleMenu = ($event) => {
  nextTick(() => {
    userMenu?.value.show($event);
  });
  //   nextTick(() => {
  //     userMenu?.value?.show($event);
  //   });

  //   $event.stopPropagation();
};

const userMenuItems = computed(() => [
  {
    label: userInfo?.value?.username,
    id: 'username',
  },
  {
    label: $t(`userMenu.title`),
    id: 'account',
    items: [
      {
        id: 'account_logout',
        label: $t(`userMenu.systemLogout`),
        icon: 'tws-logout',
        // TODO: base url + /#/login
        command: () => systemLogout(),
        // command: () => systemLogout('https://127-0-0-1.thinrdp.net/workspace-dev-aaas/#/login'),
        // command: () => router.push('/login'),
      },
    ],
  },
]);
</script>

<style scoped lang="scss">
.top-bar {
  width: 100%;
  padding: 0.75rem 1rem;
  margin: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: unset !important;
  }

  &__logo {
    height: 40px;
    width: 100px;
    .img {
      height: 100%;
      width: 100%;
      background: var(--desktop-logo);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: left center;
    }
  }

  &__title {
    font-size: 1.25rem;
    margin: 0;
    font-weight: 500;
    border-left: 1px solid var(--dark-border-color);
    padding-left: 0.5rem;
  }

  &__user {
    display: flex;
    align-items: center;
  }
}
</style>
