<template>
  <div ref="searchBox" class="search-wrapper">

    <!-- Search Input -->
    <div class="search-input-wrapper ">
      <i class="bi bi-search search-icon"></i>

      <input v-model="searchText" type="text" class="search-input" :placeholder="placeholder"
        @focus="showDropdown = true" />

      <i v-if="searchText" class="bi bi-x-circle-fill clear-icon" @click="clearSearch"></i>
    </div>

    <!-- Dropdown -->


  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from "vue";

const emit = defineEmits(["update:modelValue", "select"]);

const props = defineProps({
  modelValue: String,
  items: {
    type: Array,
    default: () => []
  },
  labelKey: {
    type: String,
    default: "fullname"
  },
  placeholder: {
    type: String,
    default: "Search..."
  }
});

const searchText = ref(props.modelValue || "");
const showDropdown = ref(false);
const searchBox = ref(null);

watch(() => props.modelValue, (val) => {
  searchText.value = val;
});

watch(searchText, (val) => {
  emit("update:modelValue", val);
});

const filteredItems = computed(() => {
  if (!searchText.value) return props.items;

  return props.items.filter(item =>
    item[props.labelKey]
      ?.toLowerCase()
      .includes(searchText.value.toLowerCase())
  );
});

const clearSearch = () => {
  searchText.value = "";
  showDropdown.value = false;
};

const handleClickOutside = (e) => {
  if (!searchBox.value?.contains(e.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script><style scoped>
.search-wrapper {
  position: relative;
  width: 100%;
  /* max-width: 520px; */
}

.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  height: 50px;
  padding: 0 45px 0 45px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 15px;
  outline: none;
  transition: all 0.25s ease;
}

.search-input:focus {
  border-color: #198754;
  box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.08);
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 16px;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 16px;
}

.clear-icon {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  color: #94a3b8;
  cursor: pointer;
}

/* .search-dropdown {
  position: absolute;
  top: 58px;
  left: 0;
  right: 0;
  background: white;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  border: 1px solid #f1f5f9;
  max-height: 280px;
  overflow-y: auto;
  z-index: 999;
  padding: 8px;
} */

.search-item {
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.search-item:hover {
  background: #f8fafc;
}

.fade-enter-active,
.fade-leave-active {
  transition: 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>