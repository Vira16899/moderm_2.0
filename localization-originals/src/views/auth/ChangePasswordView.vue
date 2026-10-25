<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <button
          @click="goToDashboard"
          class="flex items-center gap-2 text-sm text-[#84A98C] hover:underline mb-6"
        >
          <ArrowLeftIcon class="w-4 h-4" />
          ត្រឡប់ក្រោយ
        </button>

        <div class="flex flex-col items-center mb-8">
          <div
            class="w-16 h-16 bg-[#84A98C] rounded-full flex items-center justify-center mb-4"
          >
            <LockIcon class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-2xl font-normal text-gray-900 mb-2">
            ប្ដូរពាក្យសម្ងាត់
          </h1>
          <p class="text-gray-500 text-center">
            បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន និងពាក្យសម្ងាត់ថ្មីរបស់អ្នក
          </p>
        </div>

        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-normal text-gray-700 mb-2">
              ពាក្យសម្ងាត់បច្ចុប្បន្ន
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="currentPassword"
              type="password"
              placeholder="បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន"
              class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] placeholder:text-gray-400"
              :class="{ 'ring-2 ring-red-500': passwordErrors.currentPassword }"
              @input="passwordErrors.currentPassword = ''"
              required
            />
            <p v-if="passwordErrors.currentPassword" class="text-red-400 text-xs mt-1">
              {{ passwordErrors.currentPassword }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-normal text-gray-700 mb-2">
              ពាក្យសម្ងាត់ថ្មី
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="យ៉ាងហោច ៨ តួអក្សរ"
              class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] placeholder:text-gray-400"
              :class="{ 'ring-2 ring-red-500': passwordErrors.newPassword }"
              @input="passwordErrors.newPassword = ''"
              required
            />
            <p v-if="passwordErrors.newPassword" class="text-red-400 text-xs mt-1">
              {{ passwordErrors.newPassword }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-normal text-gray-700 mb-2">
              បញ្ជាក់ពាក្យសម្ងាត់
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី"
              class="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84A98C] placeholder:text-gray-400"
              :class="{ 'ring-2 ring-red-500': passwordErrors.confirmPassword }"
              @input="passwordErrors.confirmPassword = ''"
              required
            />
            <p v-if="passwordErrors.confirmPassword" class="text-red-400 text-xs mt-1">
              {{ passwordErrors.confirmPassword }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-[#84A98C] text-white py-3 rounded-lg font-normal hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {{ loading ? "កំពុងផ្លាស់ប្តូរពាក្យសម្ងាត់..." : "ប្ដូរពាក្យសម្ងាត់" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuth";
import { useToastStore } from "@/stores/useToast";
import { getRoleKey } from "@/utils/roles";

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordErrors = reactive({ currentPassword: "", newPassword: "", confirmPassword: "" });
const loading = ref(false);

const dashboardRouteByRole = {
  admin: "adminDashboard",
  manager: "managerDashboard",
  staff: "staffDashboard",
};

const getDashboardRoute = () => {
  const routeName = dashboardRouteByRole[getRoleKey(authStore.profile)];
  return routeName ? { name: routeName } : { name: "Login" };
};

const goToDashboard = () => {
  router.push(getDashboardRoute());
};

const handleChangePassword = async () => {
  let hasError = false;

  if (!currentPassword.value) {
    passwordErrors.currentPassword = "សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន";
    hasError = true;
  }

  if (newPassword.value.length < 8) {
    passwordErrors.newPassword = "ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោច ៨ តួអក្សរ";
    hasError = true;
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordErrors.confirmPassword = "ពាក្យសម្ងាត់មិនស៊ីគ្នា";
    hasError = true;
  }

  if (hasError) return;

  loading.value = true;

  try {
    await authStore.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    toastStore.success("ពាក្យសម្ងាត់បានផ្លាស់ប្តូរដោយជោគជ័យ។");
    goToDashboard();
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      "មានកំហុសពេលផ្លាស់ប្តូរពាក្យសម្ងាត់។ សូមព្យាយាមម្ដងទៀត។";
    toastStore.error(message);
  } finally {
    loading.value = false;
  }
};
</script>
