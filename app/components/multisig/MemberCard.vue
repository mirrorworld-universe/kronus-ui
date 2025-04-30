<script setup lang="ts">
import type { IMember } from "~/types/squads";

const props = defineProps<{
  member: IMember;
}>();

const toast = useToast();

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      title: "Copied to clipboard!",
      icon: "line-md:confirm-circle",
      color: "success",
    });
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }
};

const truncatedPublicKey = computed(() => truncateMiddle(props.member.public_key));

function handleClickRemoveMember(member: IMember) {
  console.log("user clicked remove member", member);
  toast.add({
    description: "Remove member coming soon",
    color: "info",
  });
}
</script>

<template>
  <UCard variant="soft">
    <div class="flex flex-col gap-4">
      <div class="flex flex-shrink-0 justify-start items-start gap-2">
        <UBadge
          v-for="(role, i) in member.roles"
          :key="`role-${member.public_key}-${role}-${i}`"
          color="neutral"
          variant="soft"
          class="rounded-full"
        >
          {{ role }}
        </UBadge>
      </div>
      <div class="flex gap-3 justify-start items-start">
        <UAvatar icon="line-md:account-small" />
        <div class="flex flex-col gap-1 items-center justify-start leading-none">
          <div class="text-sm leading-none">
            Member Name
          </div>
          <div class="flex justify-start items-center leading-none gap-1 text-xs">
            <span>
              {{ truncatedPublicKey }}
            </span>
            <UButton
              class="text-(--ui-muted) hover:text-(--ui-text)"
              icon="solar:copy-linear"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="() => copyToClipboard(member.public_key)"
            />
          </div>
        </div>

        <UButton
          class="ml-auto self-end"
          icon="line-md:person-remove"
          size="md"
          color="neutral"
          variant="soft"
          @click="() => handleClickRemoveMember(member)"
        />
      </div>
    </div>
  </UCard>
</template>
