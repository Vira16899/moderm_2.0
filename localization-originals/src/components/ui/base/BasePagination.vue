<template>
  <nav aria-label="Page navigation" v-if="totalPages > 1">
    <ul class="pagination mb-0 gap-2 justify-content-end align-items-center">

      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <button class="page-link custom-page-link rounded-3 d-flex align-items-center justify-content-center"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)">
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>

      <li v-for="page in totalPages" :key="page" class="page-item">
        <button class="page-link custom-page-link rounded-3 fw-medium"
                :class="{ active: currentPage === page }"
                @click="goToPage(page)">
          {{ page }}
        </button>
      </li>

      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <button class="page-link custom-page-link rounded-3 d-flex align-items-center justify-content-center"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>

    </ul>
  </nav>
</template>

<script setup>
const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(["change-page"]);

const goToPage = (page) => {
  if (page < 1 || page > props.totalPages) return;
  emit("change-page", page);
};
</script>

<style scoped>
.custom-page-link {
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  color: #6c757d;
  background-color: transparent;
  transition: all 0.2s;
}
.custom-page-link:hover {
  background-color: #f1f5f4;
  color: #4D7C6E;
  border-color: #e2e8e6;
  
}
.custom-page-link:focus {
  border-color: #0a6c3e;
  box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.08);
}
.custom-page-link.active {
  background-color: #4D7C6E;
  border-color: #f3f8f6;
  color: white;
  box-shadow: 0 4px 8px rgba(77, 124, 110, 0.2);
}
.page-item.disabled .custom-page-link {
  background-color: transparent;
  color: #dee2e6;
}
.page-item.disabled .custom-page-link,
.custom-page-link:disabled {
  pointer-events: none;
}
</style>
