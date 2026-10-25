<template>
  <BaseModal
    :is-open="isOpen"
    :title="isEdit ? 'កែប្រែក្រុម' : 'បង្កើតក្រុមថ្មី'"
    @close="$emit('close')"
  >
    <form id="adminGroupForm" novalidate @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2">
          ឈ្មោះក្រុម
          <span class="text-red-500">*</span>
        </label>
        <input
          v-model="localData.name"
          type="text"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
          :class="fieldClass('name')"
          placeholder="ឧទាហរណ៍៖ ក្រុមវិស្វកម្ម"
          required
          @input="clearError('name')"
        />
        <p v-if="errors.name" class="text-red-400 text-xs mt-1">{{ errors.name }}</p>
      </div>

      <div v-if="showManagerField">
        <label class="block text-sm font-normal text-gray-700 mb-2">
          អ្នកគ្រប់គ្រងក្រុម
          <span class="text-red-500">*</span>
        </label>
        <select
          v-model="localData.managerId"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
          :class="fieldClass('managerId')"
          required
          @change="clearError('managerId')"
        >
          <option value="">ជ្រើសរើសអ្នកគ្រប់គ្រង</option>
          <option v-for="manager in managers" :key="manager.id" :value="manager.id">
            {{ manager.fullName }}
          </option>
        </select>
        <p v-if="errors.managerId" class="text-red-400 text-xs mt-1">{{ errors.managerId }}</p>
      </div>

      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2">
          ការពិពណ៌នា
        </label>
        <textarea
          v-model="localData.description"
          rows="3"
          class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] resize-none"
          :class="fieldClass('description')"
          placeholder="តើក្រុមនេះនិយាយអំពីអ្វី?"
          @input="clearError('description')"
        ></textarea>
        <p v-if="errors.description" class="text-red-400 text-xs mt-1">{{ errors.description }}</p>
      </div>

      <div>
        <label class="block text-sm font-normal text-gray-700 mb-2">
          រូបភាពក្រុម
        </label>
        <div
          class="group-image-picker"
          :class="{ 'group-image-picker--error': errors.thumbnail }"
        >
          <div class="group-image-preview">
            <img
              v-if="localData.thumbnailPreview"
              :src="localData.thumbnailPreview"
              alt="Group preview"
            />
            <div v-else class="group-image-placeholder">
              <ImageIcon class="h-8 w-8" />
              <span>ជ្រើសរើសរូបភាព</span>
            </div>
          </div>
          <div class="group-image-actions">
            <input
              ref="thumbnailInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleThumbnailSelect"
            />
            <button
              type="button"
              class="group-image-btn group-image-btn--upload"
              @click="thumbnailInput?.click()"
            >
              <UploadIcon class="h-4 w-4" />
              ជ្រើសរូប
            </button>
            <button
              v-if="localData.thumbnailPreview"
              type="button"
              class="group-image-btn group-image-btn--remove"
              @click="clearThumbnail"
            >
              <XIcon class="h-4 w-4" />
              ដកចេញ
            </button>
          </div>
        </div>
        <p v-if="errors.thumbnail" class="text-red-400 text-xs mt-1">{{ errors.thumbnail }}</p>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
        >
          បោះបង់
        </button>
        <button
          type="submit"
          form="adminGroupForm"
          :disabled="loading"
          class="px-6 py-2 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-50"
        >
          {{
            loading
              ? "កំពុងរក្សាទុក..."
              : isEdit
                ? "រក្សាទុក"
                : "បង្កើតក្រុម"
          }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import {
  Image as ImageIcon,
  Upload as UploadIcon,
  X as XIcon,
} from "lucide-vue-next";
import BaseModal from "@/components/ui/base/BaseModal.vue";

const props = defineProps({
  isOpen: Boolean,
  isEdit: Boolean,
  loading: Boolean,
  showManagerField: {
    type: Boolean,
    default: false,
  },
  initialData: {
    type: Object,
    default: () => ({
      name: "",
      managerId: "",
      description: "",
      thumbnailFile: null,
      thumbnailPreview: "",
      thumbnailRemoved: false,
    }),
  },
  managers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "submit"]);

const getInitialLocalData = (data = {}) => ({
  name: "",
  managerId: "",
  description: "",
  thumbnailFile: null,
  thumbnailPreview: "",
  thumbnailRemoved: false,
  ...data,
});

const localData = ref(getInitialLocalData(props.initialData));
const thumbnailInput = ref(null);
const errors = reactive({
  name: "",
  managerId: "",
  description: "",
  thumbnail: "",
});

watch(
  () => props.initialData,
  (newData) => {
    localData.value = getInitialLocalData(newData);
    clearErrors();
  },
  { deep: true },
);

const fieldClass = (key) =>
  errors[key] ? "border-red-400 ring-2 ring-red-100" : "";

const clearError = (key) => {
  errors[key] = "";
};

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
};

const handleThumbnailSelect = (event) => {
  const file = event.target.files?.[0];
  errors.thumbnail = "";

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    errors.thumbnail = "សូមជ្រើសរើសឯកសាររូបភាព";
    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    errors.thumbnail = "រូបភាពត្រូវតែមានទំហំ ៥MB ឬតូចជាងនេះ";
    event.target.value = "";
    return;
  }

  localData.value.thumbnailFile = file;
  localData.value.thumbnailPreview = URL.createObjectURL(file);
  localData.value.thumbnailRemoved = false;
  event.target.value = "";
};

const clearThumbnail = () => {
  const hadInitialThumbnail = Boolean(props.initialData?.thumbnailPreview);

  localData.value.thumbnailFile = null;
  localData.value.thumbnailPreview = "";
  localData.value.thumbnailRemoved = hadInitialThumbnail;
  errors.thumbnail = "";
};

const validateForm = () => {
  clearErrors();

  if (!String(localData.value.name || "").trim()) errors.name = "សូមបញ្ចូលឈ្មោះក្រុម";
  if (props.showManagerField && !localData.value.managerId) {
    errors.managerId = "សូមជ្រើសរើសអ្នកគ្រប់គ្រង";
  }
  if (String(localData.value.description || "").length > 500) {
    errors.description = "ការពិពណ៌នាត្រូវតែមាន ៥០០ តួអក្សរ ឬតិចជាងនេះ";
  }

  return Object.values(errors).every((message) => !message);
};

const handleSubmit = () => {
  if (!validateForm()) return;
  emit("submit", localData.value);
};
</script>

<style scoped>
.group-image-picker {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
}

.group-image-picker--error {
  border-color: #f87171;
  box-shadow: 0 0 0 2px rgba(254, 226, 226, 0.95);
}

.group-image-preview {
  width: 120px;
  height: 82px;
  overflow: hidden;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px dashed #d1d5db;
}

.group-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.group-image-placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  gap: 4px;
  color: #9ca3af;
  font-size: 0.75rem;
}

.group-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.group-image-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 9px;
  border: 1px solid #d1d5db;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.group-image-btn--upload {
  background: #eef7f0;
  border-color: #cfe4d4;
  color: #52775d;
}

.group-image-btn--upload:hover {
  background: #84a98c;
  border-color: #84a98c;
  color: #ffffff;
}

.group-image-btn--remove {
  background: #fff7f7;
  border-color: #fee2e2;
  color: #ef4444;
}

.group-image-btn--remove:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

@media (max-width: 575.98px) {
  .group-image-picker {
    grid-template-columns: 1fr;
  }

  .group-image-preview {
    width: 100%;
    height: 140px;
  }
}
</style>
