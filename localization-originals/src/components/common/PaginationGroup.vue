<template>
  <div
    class="flex flex-col gap-3 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
    :class="bordered ? 'border-t border-gray-50' : 'border border-gray-100 rounded-xl shadow-sm'"
  >
    <p class="text-sm font-medium text-gray-400">
      ទំព័រ
      <span class="font-bold text-gray-900">{{ currentPage }}</span>
      នៃ
      <span class="font-bold text-gray-900">{{ totalPages }}</span>
    </p>

    <div class="flex items-center gap-2">
      <button
        type="button"
        @click="emitPageChange(currentPage - 1)"
        :disabled="currentPage === 1 || disabled"
        class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-gray-600 transition-all hover:border-gray-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeftIcon class="h-5 w-5" />
      </button>

      <button
        v-for="page in visiblePages"
        :key="page"
        type="button"
        @click="emitPageChange(page)"
        :disabled="disabled"
        class="hidden h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition-all sm:inline-flex sm:items-center sm:justify-center"
        :class="
          page === currentPage
            ? 'bg-[#84A98C] text-white shadow-sm'
            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
        "
      >
        {{ page }}
      </button>

      <button
        type="button"
        @click="emitPageChange(currentPage + 1)"
        :disabled="currentPage === totalPages || disabled"
        class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-gray-600 transition-all hover:border-gray-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRightIcon class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-vue-next";

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  bordered: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["page-change"]);

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, props.currentPage - 2);
  const end = Math.min(props.totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  for (let page = adjustedStart; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
});

const emitPageChange = (page) => {
  const nextPage = Math.min(Math.max(page, 1), props.totalPages);

  if (nextPage !== props.currentPage && !props.disabled) {
    emit("page-change", nextPage);
  }
};
</script>
