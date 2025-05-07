/* Refresh a specific Nuxt data query */
export function useRefresh(queryKey: Ref<string>) {
  const pending = ref(false);
  async function refresh(fallback?: () => Promise<void>) {
    pending.value = true;
    const { data } = useNuxtData(unref(queryKey));
    if (!data.value) {
      console.debug(`[refreshing]: could not find prior query key for qk: ${queryKey.value}. Manually invoking fallback fetcher with this new key ...`);
      await fallback?.();
    } else {
      console.debug(`[refreshing]: ${queryKey.value}...`);
      await refreshNuxtData(unref(queryKey));
    }
    pending.value = false;
  }

  return {
    pending,
    refresh
  };
}
