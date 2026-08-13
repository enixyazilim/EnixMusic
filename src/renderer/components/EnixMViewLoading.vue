<script setup lang="ts">
import { computed, onBeforeMount, ref } from "vue";
import logo from "~assets/icons/enixmusic.png";
import { getLocale, Language } from "~shared/locales";

const memoryStore = window.enixm.memoryStore;
const store = window.enixm.store;

const language = ref<Language>("en");
const t = computed(() => getLocale(language.value));

const enixmViewLoading = ref<boolean>(await memoryStore.get("enixmViewLoading"));
const enixmViewLoadingError = ref<boolean>(await memoryStore.get("enixmViewLoadingError"));
const enixmViewLoadTimedout = ref<boolean>(await memoryStore.get("enixmViewLoadTimedout"));
const enixmViewLoadingStatus = ref<string>((await memoryStore.get("enixmViewLoadingStatus")) ?? "");

onBeforeMount(async () => {
  if (store) {
    const general = await store.get("general");
    if (general?.language) language.value = general.language;
    store.onDidAnyChange(newState => {
      if (newState.general.language) language.value = newState.general.language;
    });
  }
  enixmViewLoading.value = await memoryStore.get("enixmViewLoading");
  enixmViewLoadTimedout.value = await memoryStore.get("enixmViewLoadTimedout");
  enixmViewLoadingError.value = await memoryStore.get("enixmViewLoadingError");
  enixmViewLoadingStatus.value = (await memoryStore.get("enixmViewLoadingStatus")) ?? "";
});

memoryStore.onStateChanged(newState => {
  enixmViewLoading.value = newState.enixmViewLoading;
  enixmViewLoadingError.value = newState.enixmViewLoadingError;
  enixmViewLoadTimedout.value = newState.enixmViewLoadTimedout;
  enixmViewLoadingStatus.value = newState.enixmViewLoadingStatus;
});
</script>

<template>
  <div class="enixmview-loading-container">
    <Transition name="fade">
      <div v-if="enixmViewLoading" class="enixmview-loading">
        <img class="logo" :src="logo" />
        <div class="music-loader">
          <div class="loader-line"></div>
          <div class="loader-line"></div>
          <div class="loader-line"></div>
          <div class="loader-line"></div>
          <div class="loader-line"></div>
          <div class="loader-line"></div>
          <div class="loader-line"></div>
          <div class="loader-line"></div>
        </div>
        <p :class="{ 'enixmview-loading-status': true, 'error': enixmViewLoadingError }">{{ enixmViewLoadingStatus }}</p>
        <p v-if="enixmViewLoadTimedout" class="enixmview-loading-timeout">{{ t.loading.timeout }}</p>
      </div>
      <div v-else class="enixmview-loading"></div>
    </Transition>
  </div>
</template>

<style scoped>
.enixmview-loading-container {
  height: calc(100% - 36px);
  background-color: #000000;
}

.enixmview-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100% - 36px);
  user-select: none;
}

.enixmview-loading-status {
  color: #969696;
}

.enixmview-loading-status.error {
  color: #f44336;
}

.enixmview-loading-timeout {
  color: #f44336;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.logo {
  width: 160px;
  height: 160px;
}

.music-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 160px;
}

.loader-line {
  width: 12px;
  height: 4px;
  border-radius: 10px;
  background-color: #ffffff;
  animation: musicloader 1.5s ease-in-out infinite;
}

.loader-line:nth-child(1) {
  animation-delay: 1s;
}

.loader-line:nth-child(2) {
  animation-delay: 0.8s;
}

.loader-line:nth-child(3) {
  animation-delay: 0.4s;
}

.loader-line:nth-child(4) {
  animation-delay: 0.2s;
}

.loader-line:nth-child(5) {
  animation-delay: 0.2s;
}

.loader-line:nth-child(6) {
  animation-delay: 0.4s;
}

.loader-line:nth-child(7) {
  animation-delay: 0.8s;
}

.loader-line:nth-child(8) {
  animation-delay: 1s;
}

@keyframes musicloader {
  0% {
    height: 4px;
  }
  50% {
    height: 72px;
  }
  100% {
    height: 4px;
  }
}
</style>
