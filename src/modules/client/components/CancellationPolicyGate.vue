<template>
  <BookingPolicyConfirm
    :model-value="modelValue"
    :agreed="agreed"
    context="cancellation"
    @update:model-value="$emit('update:modelValue', $event)"
    @update:agreed="agreed = $event"
    @read-policy="legalDialogVisible = true"
    @continue="continueCancellation"
  />
  <AgreementDialog v-model="legalDialogVisible" doc-type="terms" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import AgreementDialog from "@/modules/client/components/agreement-dialog.vue"
import BookingPolicyConfirm from "@/modules/client/components/booking-policy-confirm.vue"

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  continue: []
}>()

const agreed = ref(false)
const legalDialogVisible = ref(false)

const continueCancellation = () => {
  if (!agreed.value) return
  emit("update:modelValue", false)
  emit("continue")
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) agreed.value = false
  },
)
</script>
