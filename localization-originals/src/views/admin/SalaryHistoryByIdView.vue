<template>
  <BaseSalaryViewByIdView
    :record="arcticleStore.salaryRecord"
    :loading="arcticleStore.loading"
  />
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useArcticleStore } from "@/stores/useArcticleStore";
import BaseSalaryViewByIdView from "@/components/ui/base/BaseSalaryViewByIdView.vue";

const arcticleStore = useArcticleStore();
const route = useRoute();

onMounted(() => {
  const salaryId = route.params.id;

  if (!salaryId) {
    console.log("No salary history ID found");
    return;
  }

  arcticleStore.fetchSalaryHistoryDetail(salaryId);
});
</script>