<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
      <div
        class="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
        :class="isSuccess ? 'bg-[#84A98C]/10 text-[#84A98C]' : 'bg-orange-50 text-orange-500'"
      >
        <CheckCircleIcon v-if="isSuccess" class="w-9 h-9" />
        <MailIcon v-else class="w-9 h-9" />
      </div>

      <h1 class="text-2xl font-normal text-gray-900 mb-3">
        {{ title }}
      </h1>
      <p class="text-gray-500 mb-8">
        {{ message }}
      </p>

      <router-link
        to="/profile"
        class="inline-flex items-center justify-center px-6 py-2.5 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md"
      >
        ត្រឡប់ទៅ Profile
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CheckCircle as CheckCircleIcon, Mail as MailIcon } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();
const isLoading = ref(true);
const isSuccess = ref(false);
const errorMessage = ref("");

const getRouteValue = (value) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return String(rawValue || "").trim();
};

const verificationToken = computed(
  () =>
    getRouteValue(route.query.token) ||
    getRouteValue(route.query.code) ||
    getRouteValue(route.query.verificationToken) ||
    getRouteValue(route.params.token) ||
    "",
);

const title = computed(() => {
  if (isLoading.value) return "កំពុងបញ្ជាក់អ៊ីម៉ែល";
  return isSuccess.value ? "អ៊ីម៉ែលត្រូវបានប្តូរហើយ" : "បញ្ជាក់អ៊ីម៉ែលមិនបាន";
});

const message = computed(() => {
  if (isLoading.value) return "សូមរង់ចាំបន្តិច ខណៈពេលយើងកំពុងបញ្ជាក់អ៊ីម៉ែលថ្មីរបស់អ្នក។";
  if (isSuccess.value) return "អ៊ីម៉ែលថ្មីត្រូវបានបញ្ជាក់ជោគជ័យ។ Profile របស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាព។";
  return errorMessage.value || "តំណបញ្ជាក់អ៊ីម៉ែលមិនត្រឹមត្រូវ ឬផុតកំណត់។";
});

const syncVerifiedEmail = (response) => {
  const data = response.data?.data || response.data || {};
  const pendingEmail = localStorage.getItem("pending-email-change");
  const profile = data.user || data.profile || data;
  const verifiedEmail = getRouteValue(route.query.email) || pendingEmail;

  if (profile?.email) {
    authStore.updateUser(profile);
  } else if (verifiedEmail) {
    authStore.updateUser({ email: verifiedEmail });
  }
  localStorage.removeItem("pending-email-change");
};

onMounted(async () => {
  if (!verificationToken.value) {
    isLoading.value = false;
    errorMessage.value = "ខ្វះលេខកូដបញ្ជាក់ (Verification Token)។";
    return;
  }

  try {
    const response = await authStore.verifyEmailChange({
      token: verificationToken.value,
    });
    syncVerifiedEmail(response);
    isSuccess.value = true;
    toastStore.success("ប្តូរអ៊ីមែលបានជោគជ័យ");
    authStore.clearSession();
    setTimeout(() => {
      router.push("/login");
    }, 1200);
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || err.message || "មិនអាចបញ្ជាក់ការប្តូរអ៊ីមែលបានទេ៖ តំណភ្ជាប់មិនត្រឹមត្រូវ ឬផុតកំណត់។";
  } finally {
    isLoading.value = false;
  }
});
</script>
