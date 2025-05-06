<script setup lang="ts">
const colorMode = useColorMode();

const color = computed(() =>
  colorMode.value === "dark" ? "#1b1718" : "white"
);

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color }
  ],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: "en"
  }
});

const appConfig = useAppConfig();

const title = "Kronus UI - Sonic SVM's Multi-sig client for Squads v4";
const description
  = "Kronus is an open-source alternative to Squads.so, providing a comprehensive front-end client for multisig operations across Solana and other SVMs/alt-chains.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
});
</script>

<template>
  <UApp :toaster="appConfig.toaster">
    <NuxtLoadingIndicator />

    <Suspense>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <template #fallback>
        <div class="h-screen flex flex-col justify-center items-center gap-5">
          <UIcon name="svg-spinners:bars-rotate-fade" class="size-5" />
          <div class="text-xs">
            Loading
          </div>
        </div>
      </template>
    </Suspense>
  </UApp>
</template>
