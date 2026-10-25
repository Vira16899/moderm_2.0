<template>
  <span
    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
    :class="getVariantClasses()"
  >
    {{ displayStatus }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) =>
      ["default", "success", "warning", "destructive", "info"].includes(value),
  },
});

const getStatusVariant = (status) => {
  const statusUpper = status?.toUpperCase() || "";
  if (
    ["ACTIVE", "ACTIVATED", "REVIEWED", "COMPLETED", "SUCCESS", "ADMIN"].includes(
      statusUpper,
    )
  )
    return "success";
  if (["DRAFT", "PENDING", "WARNING", "MANAGER"].includes(statusUpper))
    return "warning";
  if (
    ["INACTIVE", "DEACTIVATED", "REJECTED", "FAILED", "DESTRUCTIVE"].includes(
      statusUpper,
    )
  )
    return "destructive";
  if (["SUBMITTED", "IN_PROGRESS", "INFO", "STAFF"].includes(statusUpper))
    return "info";
  return "default";
};

const finalVariant = computed(() => {
  return props.variant === "default"
    ? getStatusVariant(props.status)
    : props.variant;
});

const displayStatus = computed(() => {
  const labels = {
    ACTIVE: "សកម្ម",
    ACTIVATED: "សកម្ម",
    INACTIVE: "អសកម្ម",
    DEACTIVATED: "អសកម្ម",
    DRAFT: "ព្រាង",
    SUBMITTED: "បានដាក់ស្នើ",
    REVIEWED: "បានពិនិត្យ",
    COMPLETED: "បានបញ្ចប់",
    PENDING: "កំពុងរង់ចាំ",
    ADMIN: "អ្នកគ្រប់គ្រងប្រព័ន្ធ",
    MANAGER: "អ្នកគ្រប់គ្រង",
    STAFF: "បុគ្គលិក",
  };
  return labels[props.status?.toUpperCase()] || props.status;
});

const getVariantClasses = () => {
  switch (finalVariant.value) {
    case "success":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "warning":
      return "bg-amber-50 text-amber-600 border-amber-100";
    case "destructive":
      return "bg-red-50 text-red-600 border-red-100";
    case "info":
      return "bg-blue-50 text-blue-600 border-blue-100";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};
</script>
