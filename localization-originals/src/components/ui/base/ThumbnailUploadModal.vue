<template>
  <BaseModal
    :is-open="isOpen"
    title="រូបភាពក្រុម"
    @close="$emit('close')"
  >
    <div class="space-y-6 text-center">
      <div
        class="relative w-48 h-48 mx-auto rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="flex flex-col items-center gap-3 text-gray-300"
        >
          <ImageIcon class="w-12 h-12" />
          <p class="text-xs font-normal uppercase tracking-widest">
            មើលជាមុន
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <input
          type="file"
          ref="fileInput"
          class="hidden"
          accept="image/*"
          @change="handleFileSelect"
        />
        <button
          @click="if (fileInput) fileInput.click();"
          class="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-normal border border-gray-200"
        >
          ជ្រើសរើសរូបភាព
        </button>
        <p v-if="error" class="text-red-400 text-xs">{{ error }}</p>
        <button
          v-if="selectedFile"
          @click="handleSubmit"
          :disabled="loading"
          class="w-full py-2.5 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-50"
        >
          {{ loading ? "កំពុងរក្សាទុក..." : "រក្សាទុករូបភាព" }}
        </button>
        <button
          v-if="hasThumbnail"
          @click="$emit('delete')"
          :disabled="loading"
          class="w-full py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm disabled:opacity-50"
        >
          ដករូបភាពបច្ចុប្បន្នចេញ
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from "vue";
import { Image as ImageIcon } from "lucide-vue-next";
import BaseModal from "@/components/ui/base/BaseModal.vue";

defineProps({
  isOpen: Boolean,
  loading: Boolean,
  hasThumbnail: Boolean,
});

const emit = defineEmits(["close", "submit", "delete"]);

const fileInput = ref(null);
const selectedFile = ref(null);
const previewUrl = ref("");
const error = ref("");

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  error.value = "";
  selectedFile.value = null;
  previewUrl.value = "";

  if (!file) return;
  if (!file.type.startsWith("image/")) {
    error.value = "សូមជ្រើសរើសឯកសាររូបភាព";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = "រូបភាពត្រូវតែមានទំហំ ៥MB ឬតូចជាងនេះ";
    return;
  }

  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
};

const handleSubmit = () => {
  if (selectedFile.value) {
    emit("submit", selectedFile.value);
  }
};
</script>
