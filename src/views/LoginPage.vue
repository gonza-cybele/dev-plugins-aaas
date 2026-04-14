<script setup>
import { ref, provide } from 'vue';
import { useRoute } from 'vue-router';
import LoginContainer from '@views/Login/Basic/LoginContainer.vue';
// import { redirectUriFormatter } from '@views/Login/utils/redirectUriFormatter';
// import WebSettings from '@utils/webSettings';
import LogoAnimated from '@components/LogoAnimated/LogoAnimated.vue';
import LoginDevTool from '@views/Login/utils/LoginDevTool.vue';
// import { applyBasePathName } from '@utils/basePath';

const route = useRoute();

// Custom login success handler for AaaS - redirects to /apps-home by default
const onLoginSuccess = (data) => {
  // location.href = import.meta.env.MODE === 'development' ? '/workspace-dev-aaas/' : '/';
  location.href = import.meta.env.BASE_URL;

  /* 
  const redirectUri = data?.redirectUri;
  // Default to /apps-home for AaaS instead of root /
  let newLocation = redirectUri ? redirectUriFormatter(redirectUri, WebSettings?.defaultSettings) : '/apps-home';

  // Ensure the default redirect is /apps-home if no redirectUri or if it's root
  if (!redirectUri || newLocation === '/' || newLocation === '') {
    newLocation = '/apps-home';
  }

  location.href = applyBasePathName(newLocation); */
};

provide('devTools', {
  mode: ref(),
  state: ref({}),
});
</script>

<template>
  <div id="login" class="login__page">
    <div class="background"></div>
    <section id="login_brand">
      <LogoAnimated />
    </section>
    <section id="login_form">
      <Transition>
        <LoginContainer :errmsg="route?.query.errmsg" @loginSuccess="onLoginSuccess">
          <template #title>
            <!-- NOTE: Intentionally hardcoded title to avoid i18n issues on product name-->
            <h2 class="login-title">Application as a Service</h2>
          </template>
        </LoginContainer>
      </Transition>
    </section>
    <LoginDevTool />
  </div>
</template>

<style scoped>
.login-title {
  color: var(--primary-color);
}
</style>
