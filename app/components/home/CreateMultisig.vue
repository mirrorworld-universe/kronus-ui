<script setup lang="ts">
import { ref, computed } from "vue";
import type { StepperItem } from "@nuxt/ui";
import { useForm, useField } from "vee-validate";
import { object, string, custom, array, number } from "zod";
import { toTypedSchema } from "@vee-validate/zod";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";
import { types } from "@sqds/multisig";
import { useWalletConnection } from "~/composables/useWalletConnection";
import { useConnection } from "~/composables/useConnection";

const { walletAddress } = useWalletConnection();
const wallet = useWallet();
const { connection } = useConnection();

const items: StepperItem[] = [
  { value: "details", title: "Multisig Details", description: "Name and describe your Multisig" },
  { value: "members", title: "Members & Threshold", description: "Add wallet addresses and set confirmations" },
  { value: "review", title: "Review", description: "Review and create your Multisig" }
] as const;

type StepperValue = (typeof items)[number]["value"];
const activeStep = ref<StepperValue>("details");

const toast = useToast();

interface Member {
  address: string;
  label?: string;
  error?: string;
}

interface FormValues {
  name: string;
  description?: string;
  members: Member[];
  threshold: number;
}

interface FormErrors {
  name?: string;
  description?: string;
  members?: Array<{
    address?: string;
    label?: string;
  }>;
  threshold?: string;
}

// Custom Zod validator for Solana public keys
const isSolanaPublicKey = custom<string>((value) => {
  try {
    if (typeof value !== "string") return false;
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}, "Invalid Solana public key");

// Validation schema for the multisig details
const multisigSchema = object({
  name: string()
    .min(1, "Name is required")
    .max(32, "Name must be less than 32 characters"),
  description: string()
    .max(64, "Description must be less than 64 characters")
    .optional(),
  members: array(object({
    address: isSolanaPublicKey,
    label: string().max(32, "Label must be less than 32 characters").optional()
  }))
    .min(1, "At least one member is required")
    .max(10, "Maximum 10 members allowed"),
  threshold: number()
    .refine((val) => {
      const num = parseInt(String(val));
      return !isNaN(num) && num > 0;
    }, "Threshold must be a positive number")
});

const { handleSubmit, errors, values } = useForm<FormValues>({
  validationSchema: toTypedSchema(multisigSchema),
  initialValues: {
    name: "",
    description: "",
    members: [{ address: walletAddress.value || "", label: "" }],
    threshold: 1
  }
});

const router = useRouter();

const { value: name } = useField<string>("name");
const { value: description } = useField<string>("description");
const { value: members } = useField<Member[]>("members");
const { value: threshold } = useField<number>("threshold");

const formErrors = computed(() => errors.value as FormErrors);
const isLoading = ref(false);
const onSubmit = handleSubmit(async (formValues) => {
  try {
    isLoading.value = true;
    // Example of using the connection
    const latestBlockhash = await connection.value.getLatestBlockhash();
    console.log("Latest blockhash:", latestBlockhash);

    const { signature, multisigAddress } = await createMultisig(
      wallet,
      wallet.publicKey.value!,
      wallet.publicKey.value!,
      // No timelock
      0,
      values.members.map(mem => ({
        key: new PublicKey(mem.address),
        permissions: types.Permissions.all()
      })),
      values.threshold,
      wallet.publicKey.value,
      `Create multisig for ${wallet.publicKey.value?.toBase58()} at ${Date.now()}`
    );

    // Rest of your submission logic...
    console.log("Form values:", formValues);

    console.log("Created multisig at address", multisigAddress);
    console.log("Hash", signature);

    toast.add({
      title: "Success!",
      description: `Successfully created new multisig key ${multisigAddress}`,
      actions: [{
        icon: "i-lucide-eye",
        label: "Go to vault",
        color: "success",
        variant: "outline",
        onClick: (e) => {
          e?.stopPropagation();
          navigator.clipboard.writeText(multisigAddress);
          router.push(`/accounts/${multisigAddress}`);
        }
      },
      {
        icon: "i-lucide-link",
        label: "View ",
        color: "success",
        variant: "soft",
        onClick: (e) => {
          e?.stopPropagation();
          window.open(`https://explorer.sonic.game/tx/${signature}`);
        }
      }]
    });
  } catch (error) {
    console.error("Error submitting form:", error);
  } finally {
    isLoading.value = false;
  }
});

function goToStep(step: StepperValue) {
  activeStep.value = step;
  // // Validate current step before moving
  // if (step === "members" && !errors.value?.name) {
  // } else if (step === "review" && !errors.value?.members) {
  //   activeStep.value = step;
  // }
}
const validMembers = computed(() => members.value.filter(member => member.address.trim() !== "" && !isSolanaPublicKey.safeParse(member.address.trim()).error));
const validDedupedMembers = computed(() => new Set([...validMembers.value]));
const nonEmptyMembers = computed(() => validDedupedMembers.value.size);

const updateMemberField = async (index: number, field: keyof Member, value: string | number) => {
  if (members.value) {
    const newValue = field === "address" ? String(value) : value;
    members.value[index] = {
      ...members.value[index],
      [field]: newValue,
      error: field === "address" && String(value).trim() !== "" ? isSolanaPublicKey.safeParse(newValue).error ? "Invalid Solana public key" : undefined : undefined
    } as Member;
  }
};

const removeMember = (index: number) => {
  if (members.value && members.value.length > 1) {
    // Don't allow removing if it's the connected wallet
    if (members.value[index]?.address === walletAddress.value) {
      return;
    }
    members.value = members.value.filter((_, i) => i !== index);

    // Adjust threshold if needed
    if (threshold.value > members.value.length) {
      threshold.value = members.value.length;
    }
  }
};

const addMember = () => {
  if (members.value) {
    members.value.push({ address: "", label: "" });
  }
};

const hasInvalidAddresses = computed(() => !!members.value.find(member => member.error));

const emit = defineEmits(["cancel"]);
</script>

<template>
  <form class="flex flex-col gap-8 h-full px-4 pt-8 pb-16 justify-start items-center sm:gap-12" @submit.prevent="onSubmit">
    <UStepper
      v-model="activeStep"
      :items="items"
    >
      <template #content="{ item }">
        <!-- Details -->
        <div v-if="item.value === 'details'" class="w-full flex flex-col items-center justify-center space-y-8 pt-4">
          <div class="max-w-1/2 flex flex-col justify-center items-center space-y-4 text-center">
            <h3 class="font-semibold text-3xl">
              Secure your Sonic SVM assets with ease.
            </h3>
            <div class="text-secondary-100">
              Give your Multisig a name. You can always adjust the Multisig details later
            </div>
          </div>
          <div />
          <UCard variant="soft" class="w-full">
            <template #header>
              <h3 class="font-medium text-lg">
                Create a Multisig
              </h3>
            </template>

            <div class="w-full flex flex-col justify-center space-y-4 text-center">
              <UInput
                v-model="name"
                name="name"
                variant="soft"
                placeholder="Multisig name"
                :ui="{ trailing: 'pe-1' }"
                size="xl"
              >
                <template v-if="formErrors?.name" #help>
                  <span class="text-red-500">{{ formErrors.name }}</span>
                </template>
              </UInput>

              <UFormField label="Multisig description" class="w-full">
                <UInput
                  v-model="description"
                  name="description"
                  class="w-full"
                  variant="soft"
                  placeholder="Description (max 64 characters)"
                >
                  <template v-if="formErrors?.description" #help>
                    <span class="text-red-500">{{ formErrors.description }}</span>
                  </template>
                </UInput>
              </UFormField>
            </div>

            <template #footer>
              <div class="flex items-center justify-end space-x-4">
                <UButton class="w-full justify-center" variant="soft" @click="emit('cancel')">
                  Cancel
                </UButton>
                <UButton class="w-full justify-center" variant="solid" @click="goToStep('members')">
                  Next
                </UButton>
              </div>
            </template>
          </UCard>
        </div>

        <!-- Members -->

        <div v-if="item.value === 'members'" class="w-full flex flex-col items-center justify-center space-y-6 pt-4">
          <div class="max-w-2/3 flex flex-col justify-center items-center space-y-4 text-center">
            <h3 class="font-semibold text-3xl">
              And Members and configure your multisig security
            </h3>
            <div class="text-secondary-100">
              Add your team members and set threshold
            </div>
          </div>
          <div />
          <UCard variant="subtle">
            <template #header>
              <h3 class="font-medium text-lg">
                Add initial multisig members
              </h3>
            </template>

            <div class="space-y-4">
              <div v-for="(member, index) in members" :key="index" class="w-full flex flex-col gap-2">
                <div class="flex justify-start items-start gap-4">
                  <div class="flex-1 flex flex-col gap-1">
                    <UFormField :id="`members.${index}.label`" :error="members[index]?.error">
                      <UInput
                        :name="`members.${index}.address`"
                        :model-value="members[index]?.address || ''"
                        placeholder="Enter wallet address"
                        variant="soft"
                        :ui="{
                          base: formErrors?.members?.[index]?.address ? 'relative border-red-500 dark:border-red-500' : 'relative'
                        }"
                        class="w-full"
                        :disabled="members[index]?.address === walletAddress"
                        @update:model-value="value => updateMemberField(index, 'address', value)"
                      >
                        <template v-if="members[index]?.address !== walletAddress" #trailing>
                          <UButton
                            color="neutral"
                            variant="link"
                            size="sm"
                            icon="i-lucide-trash"
                            aria-label="Clear input"
                            @click="removeMember(index)"
                          />
                        </template>
                      </UInput>
                    </UFormField>
                  </div>

                  <UInput
                    :name="`members.${index}.label`"
                    :model-value="members[index]?.label || ''"
                    placeholder="Optional label"
                    variant="soft"
                    @update:model-value="value => updateMemberField(index, 'label', value)"
                  />
                </div>
              </div>

              <UButton variant="ghost" icon="i-heroicons-plus" @click="addMember">
                Add Member
              </UButton>

              <UAlert
                class="bg-transparent w-full px-0"
                :ui="{
                  description: 'text-xs'
                }"
                color="warning"
                variant="soft"
                description="Only add wallets that you fully control. Do not add CEX addresses, as they can't be used to sign transactions."
                icon="i-lucide-info"
              />
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <h3 class="text-base font-medium">
                  Set confirmation threshold
                </h3>
                <div class="text-secondary-50 text-xs">
                  Number of confirmations required ({{ threshold }} out of {{ nonEmptyMembers }})
                </div>
              </div>
              <div />
              <UFormField class="w-full flex flex-col">
                <USlider
                  v-model="threshold"
                  :min="1"
                  :max="nonEmptyMembers"
                  :default-value="1"
                  size="xs"
                />
                <div class="flex justify-between items-center mt-2">
                  <div v-for="(_, index) in nonEmptyMembers" :key="`${index}-count`" class="text-sm">
                    {{ index + 1 }}
                  </div>
                </div>
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-between">
                <UButton variant="ghost" @click="goToStep('details')">
                  Back
                </UButton>
                <UButton :disabled="hasInvalidAddresses" variant="solid" @click="goToStep('review')">
                  Next
                </UButton>
              </div>
            </template>
          </UCard>
        </div>

        <!-- Review -->
        <div v-if="item.value === 'review'" class="w-full flex flex-col items-center justify-center space-y-8 pt-4">
          <div class="max-w-1/2 flex flex-col justify-center items-center space-y-4 text-center">
            <h3 class="font-semibold text-3xl">
              Review and confirm
            </h3>
            <div class="text-secondary-100">
              One last look at the selected parameters before the Multisig is deployed
            </div>
          </div>

          <UCard variant="subtle" class="w-full">
            <template #header>
              <h3 class="font-medium text-xl">
                Review your Multisig
              </h3>
            </template>

            <div class="space-y-4">
              <!-- Squad Name -->
              <div class="flex items-center gap-4">
                <UAvatar
                  class="bg-gray-900"
                  size="lg"
                  icon="i-lucide-users"
                />
                <span class="text-2xl">{{ values.name }}</span>
              </div>

              <!-- Key Stats -->
              <div class="flex justify-center">
                <div class="grid grid-cols-3 gap-4 w-fit">
                  <UCard variant="soft" class="space-y-2 w-[200px]">
                    <div class="flex items-center gap-2">
                      <span class="text-3xl">{{ nonEmptyMembers }}</span>
                      <UIcon name="i-lucide-users" class="text-xl" />
                    </div>
                    <div class="text-secondary-100">
                      Members
                    </div>
                  </UCard>

                  <UCard variant="soft" class="space-y-2 w-[200px]">
                    <div class="flex items-center gap-2">
                      <span class="text-3xl">{{ threshold }}/{{ nonEmptyMembers }}</span>
                      <UIcon name="i-lucide-shield" class="text-xl" />
                    </div>
                    <div class="text-secondary-100">
                      Threshold
                    </div>
                  </UCard>

                  <UCard variant="soft" class="space-y-2 w-[200px]">
                    <div class="flex items-center gap-2">
                      <span class="text-3xl">~0.0530</span>
                    </div>
                    <div class="text-secondary-100 ">
                      Deploy fee
                    </div>
                  </UCard>
                </div>
              </div>

              <!-- Deploy Fee Info -->
              <UAlert
                class="bg-transparent w-sm"
                color="neutral"
                variant="soft"
                :ui="{
                  description: 'text-secondary-100 text-xs'
                }"
              >
                <template #description>
                  This amount consists of 0.05 SOL one-time platform fee, 0.001 SOL which will be deposited into your Multisig account and ~0.0020 SOL network rent needed for account deployment.
                </template>
              </UAlert>
            </div>

            <template #footer>
              <div class="flex justify-between">
                <UButton variant="ghost" @click="goToStep('members')">
                  Back
                </UButton>
                <UButton type="submit" variant="solid" :loading="isLoading">
                  Confirm
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </template>
    </UStepper>
  </form>
</template>
