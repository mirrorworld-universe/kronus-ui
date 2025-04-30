/* Refresh a specific Nuxt data query */
export function useRefresh(queryKey: Ref<string>) {
  const pending = ref(false);
  async function refresh() {
    pending.value = true;
    console.debug(`[refreshing]: ${queryKey.value}...`);
    await refreshNuxtData(unref(queryKey));
    pending.value = false;
  }

  return {
    pending,
    refresh
  };
}
