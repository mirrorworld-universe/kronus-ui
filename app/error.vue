<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{
  error: NuxtError;
}>();

useSeoMeta({
  title: "Page not found",
  description: "We are sorry but this page could not be found."
});

useHead({
  htmlAttrs: {
    lang: "en"
  }
});

watchEffect(() => console.error(props.error));
</script>

<template>
  <UApp>
    <UError :error="error" />
  </UApp>
</template>
