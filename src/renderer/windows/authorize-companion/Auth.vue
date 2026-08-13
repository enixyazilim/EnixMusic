<script setup lang="ts">
import { computed, onBeforeMount, ref } from "vue";
import { getLocale, Language } from "~shared/locales";

const appName = ref("");
const code = ref("");
const language = ref<Language>("en");

const t = computed(() => getLocale(language.value));

function denyCompanion() {
  window.enixm.sendResult(false);
}

function allowCompanion() {
  window.enixm.sendResult(true);
}

onBeforeMount(async () => {
  appName.value = await window.enixm.getAppName();
  code.value = await window.enixm.getCode();
  if (window.enixm.getLanguage) {
    language.value = (await window.enixm.getLanguage()) as Language;
  }
});
</script>

<template>
  <div class="container-wrapper">
    <div class="container">
      <h1 class="title">{{ t.authWindow.title }}</h1>
      <p class="subtitle">
        <template v-if="language === 'en'">
          <b>{{ appName }}</b> wants to control Enix Music
        </template>
        <template v-else>
          <b>{{ appName }}</b>, Enix Music uygulamasını kontrol etmek istiyor
        </template>
      </p>
      <p class="code-confirm">
        <template v-if="language === 'en'">
          Please ensure the code below matches the code displayed on <b>{{ appName }}</b>
        </template>
        <template v-else>
          Lütfen aşağıdaki kodun <b>{{ appName }}</b> üzerinde gösterilenle eşleştiğinden emin olun
        </template>
      </p>
      <p class="code">{{ code }}</p>
      <div class="buttons">
        <button class="deny" @click="denyCompanion">{{ t.authWindow.deny }}</button>
        <button class="allow" @click="allowCompanion">{{ t.authWindow.allow }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container-wrapper {
  width: 100%;
  height: calc(100% - 36px);
  background-color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.container {
  padding: 8%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.title,
.subtitle,
.code-confirm,
.code {
  margin: unset;
  text-align: center;
}

.title {
  margin-bottom: 16px;
  font-size: 36px;
}

.subtitle {
  font-weight: normal;
  font-size: 20px;
}

.code-confirm {
  margin-top: 32px;
  font-size: 20px;
}

.code {
  margin-top: 16px;
  font-size: 36px;
  color: #f44336;
}

.buttons {
  margin-top: 48px;
}

.allow,
.deny {
  background: unset;
  border: 1px solid #212121;
  padding: 16px 32px;
  margin-right: 32px;
  border-radius: 4px;
  cursor: pointer;
}

.allow:hover {
  background-color: #212121;
}

.deny {
  background-color: #d32f2f;
}

.deny:hover {
  background-color: #c62828;
}
</style>
