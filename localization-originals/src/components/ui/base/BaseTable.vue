<template>
  <div class="table-responsive bg-white rounded-4 border border-light shadow-sm">

    <table class="table table-hover align-middle custom-table mb-0 shadow-lg">

      <!-- HEADER -->
      <thead class="table-header">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="text-uppercase fw-bold text-muted py-3 px-4"
            style="font-size: 14px; letter-spacing: 0.5px; color:#406159;"
          >
            {{ col.label }}
          </th>

          <!-- ACTION COLUMN HEADER -->
          <th
            v-if="$slots.action"
            class="text-end text-uppercase fw-semibold text-muted py-3 px-4"
            style="font-size: 0.75rem;"
          >
            Actions
          </th>
        </tr>
      </thead>

      <!-- BODY -->
      <tbody>

        <!-- LOADING -->
        <tr v-if="loading">
          <td :colspan="columns.length + ($slots.action ? 1 : 0)" class="p-0">
            <SkeletonLoader
              type="table"
              :rows="6"
              :columns="columns.length + ($slots.action ? 1 : 0)"
            />
          </td>
        </tr>

        <!-- EMPTY -->
        <tr v-else-if="!data || data.length === 0">
          <td :colspan="columns.length + ($slots.action ? 1 : 0)" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-2 d-block mb-2"></i>
            No data available
          </td>
        </tr>

        <!-- DATA -->
        <tr
          v-else
          v-for="(item, index) in data"
          :key="item.id || index"
          class="custom-row"
        >

          <td
            v-for="col in columns"
            :key="col.key"
            class="py-3 px-4"
          >
            <slot :name="col.key" :item="item">
              {{ item[col.key] }}
            </slot>
          </td>

          <!-- ACTION SLOT -->
          <td v-if="$slots.action" class="py-3 px-4 text-end">
            <slot name="action" :item="item" />
          </td>

        </tr>

      </tbody>

    </table>
  </div>
</template>

<script setup>
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";

defineProps({
  columns: Array,
  data: Array,
  loading: Boolean
})
</script>
