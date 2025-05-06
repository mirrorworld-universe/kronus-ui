<script setup lang="ts">
const toast = useToast();

onMounted(async () => {
  const cookie = useCookie("cookie-consent");
  if (cookie.value === "accepted") {
    return;
  }

  toast.add({
    title: "We use first-party cookies to enhance your experience on our website.",
    duration: 0,
    close: false,
    actions: [{
      label: "Accept",
      color: "neutral",
      variant: "outline",
      onClick: () => {
        cookie.value = "accepted";
      }
    }, {
      label: "Opt out",
      color: "neutral",
      variant: "ghost"
    }]
  });
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <slot />
  </UDashboardGroup>
</template>
