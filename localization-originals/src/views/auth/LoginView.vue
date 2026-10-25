<template>
  <div
    class="min-h-screen bg-gray-100 dark:bg-[#172529] flex items-center justify-center p-4 md:p-8 khmer-font transition-colors duration-300"
  >
    <div
      class="flex flex-col lg:flex-row w-full max-w-[980px] min-h-[620px] shadow-2xl rounded-[2rem] overflow-hidden bg-white dark:bg-[#111D20] border border-gray-200/60 dark:border-transparent transition-all duration-300"
    >
      <div
        class="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative left-branding-panel"
      >
        <div class="flex flex-col items-center text-center mt-3">
          <div
            class="w-[120px] h-[120px] flex items-center justify-center bg-white rounded-full shadow-md mb-6"
          >
            <img
              src="@/assets/logo.png"
              alt="NoamSar Logo"
              class="w-[100px] h-[100px] object-contain rounded-full"
            />
          </div>
          <h1
            class="text-[2.4rem] font text-white bold-font mb-1 tracking-[3px]"
            style="color: aliceblue"
          >
            NOAM-SAR
          </h1>
          <span class="text-xs font-semibold text-white/50 tracking-[5px]"
            >STAFF ALERT SYSTEM</span
          >
        </div>

        <div class="my-auto py-10 text-center w-full">
          <p
            class="text-white/70 text-sm font-normal mx-auto max-w-[320px] leading-relaxed"
          >
            គ្រប់គ្រងការជូនដំណឹង ក្រុមការងារ និងព័ត៌មានសំខាន់ៗប្រចាំថ្ងៃ
            ប្រកបដោយសុវត្ថិភាព និងប្រសិទ្ធភាព។
          </p>
        </div>

        <div class="relative w-full h-[140px] mt-auto">
          <div
            class="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center absolute left-5 top-10 z-10 shadow-lg"
          >
            <i class="bi bi-shield-lock-fill text-3xl text-white"></i>
          </div>

          <div
            class="absolute bg-white/20 h-[2px] origin-left z-0 left-[76px] top-[68px] w-[110px] -rotate-[25deg]"
          ></div>
          <div
            class="absolute bg-white/20 h-[2px] origin-left z-0 left-[76px] top-[68px] w-[155px] rotate-[2deg]"
          ></div>
          <div
            class="absolute bg-white/20 h-[2px] origin-left z-0 left-[76px] top-[68px] w-[95px] rotate-[30deg]"
          ></div>

          <div
            class="w-11 h-11 !bg-white rounded-xl flex items-center justify-center absolute z-10 shadow-sm left-[180px] top-0 border border-gray-100"
          >
            <i class="bi bi-bell-fill !text-amber-500 text-xl"></i>
          </div>

          <div
            class="w-11 h-11 !bg-white rounded-xl flex items-center justify-center absolute z-10 shadow-sm left-[230px] top-[48px] border border-gray-100"
          >
            <i class="bi bi-people-fill !text-emerald-600 text-xl"></i>
          </div>

          <div
            class="w-11 h-11 !bg-white rounded-xl flex items-center justify-center absolute z-10 shadow-sm left-[160px] top-[96px] border border-gray-100"
          >
            <i class="bi bi-patch-check-fill !text-blue-500 text-xl"></i>
          </div>
        </div>
      </div>

      <div
        class="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-white dark:bg-[#111D20] transition-colors duration-300"
      >
        <div class="w-full max-w-[360px]">
          <div class="mb-8 text-center">
            <div class="w-20 h-20 bg-white dark:bg-white/10 flex items-center justify-center rounded-full mb-4 mx-auto shadow-[0_4px_20px_rgba(90,150,136,0.25)]">
              <i class="bi bi-shield-lock text-4xl text-[#5A9688]"></i>
            </div>
            <span
              class="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide"
              >សូមស្វាគមន៍មកកាន់ប្រព័ន្ធ</span
            >
            <h2
              class="text-3xl font-bold text-gray-800 dark:text-white mt-1 mb-2"
            >
              ចូលគណនី
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-xs px-4">
              បញ្ចូលព័ត៌មានរបស់អ្នក ដើម្បីបន្តទៅកាន់ផ្ទាំងគ្រប់គ្រង។
            </p>
          </div>

          <form novalidate @submit.prevent="handleSubmit" class="space-y-5">
            <div>
              <label
                class="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-2"
                >អុីម៉ែល</label
              >
              <div class="relative flex items-center">
                <span
                  class="absolute left-4 z-10 pointer-events-none text-gray-400 dark:text-gray-500 flex items-center"
                >
                  <i class="bi bi-envelope"></i>
                </span>
                <input
                  v-model="email"
                  type="email"
                  autocomplete="off"
                  placeholder="សូមបញ្ចូលអុីម៉ែលរបស់អ្នក"
                  class="w-full py-3.5 pl-11 pr-4 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-transparent rounded-xl transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#5A9688] focus:ring-4 focus:ring-[#5A9688]/15"
                  :class="{
                    '!border-red-500 !bg-red-50 dark:!bg-red-500/5 focus:ring-red-500/15':
                      errors.email,
                  }"
                  @input="handleEmailInput"
                />
              </div>
              <p
                v-if="errors.email"
                class="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"
              >
                <i class="bi bi-exclamation-circle-fill"></i> {{ errors.email }}
              </p>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label
                  class="text-xs font-semibold text-gray-700 dark:text-gray-400"
                  >ពាក្យសម្ងាត់</label
                >
                <router-link
                  to="/forgot-password"
                  class="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-[#5A9688] transition-colors no-underline"
                >
                  ភ្លេចពាក្យសម្ងាត់?
                </router-link>
              </div>
              <div class="relative flex items-center">
                <span
                  class="absolute left-4 z-10 pointer-events-none text-gray-400 dark:text-gray-500 flex items-center"
                >
                  <i class="bi bi-lock"></i>
                </span>
                <input
                  v-model="password"
                  :type="isPassVisible ? 'text' : 'password'"
                  autocomplete="off"
                  placeholder="••••••••"
                  class="w-full py-3.5 pl-11 pr-12 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-transparent rounded-xl transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#5A9688] focus:ring-4 focus:ring-[#5A9688]/15"
                  :class="{
                    '!border-red-500 !bg-red-50 dark:!bg-red-500/5 focus:ring-red-500/15':
                      errors.password,
                  }"
                  @input="handlePasswordInput"
                />
                <button
                  type="button"
                  class="absolute right-4 z-10 flex items-center border-0 bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  @click="isPassVisible = !isPassVisible"
                >
                  <i
                    :class="isPassVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"
                  ></i>
                </button>
              </div>
              <p
                v-if="errors.password"
                class="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"
              >
                <i class="bi bi-exclamation-circle-fill"></i>
                {{ errors.password }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 bg-[#5A9688] hover:bg-[#4a7d71] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-[#5A9688]/20 transition-all duration-200 flex items-center justify-center gap-2 mt-6"
            >
              <span
                v-if="loading"
                class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              ></span>
              <span>{{ loading ? "កំពុងចូល..." : "ចូលគណនី" }}</span>
              <i v-if="!loading" class="bi bi-arrow-right-short text-xl"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import Toast from "@/components/common/Toast.vue";
import { useTheme } from "@/composables/useTheme";
import {
  consumeSuspendedAccountMessage,
  isSuspendedAccountException,
  SUSPENDED_ACCOUNT_MESSAGE,
  SUSPENDED_ACCOUNT_REASON,
} from "@/utils/accountStatus";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();
const { isDark } = useTheme();

const email = ref("");
const password = ref("");
const loading = ref(false);
const isPassVisible = ref(false);
const errors = reactive({ email: "", password: "" });

const validateEmailFormat = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

const handleEmailInput = () => {
  if (!email.value) {
    errors.email = "សូមបញ្ចូលអុីមែលរបស់អ្នក";
  } else if (!validateEmailFormat(email.value)) {
    errors.email = "ទម្រង់អ៊ីម៉ែលមិនត្រឹមត្រូវ";
  } else {
    errors.email = "";
  }
};

const handlePasswordInput = () => {
  if (!password.value) {
    errors.password = "សូមបញ្ចូលពាក្យសម្ងាត់របស់អ្នក";
  } else if (password.value.length < 8) {
    errors.password = "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោច ៨ តួអក្សរ";
  } else {
    errors.password = "";
  }
};

const validateForm = () => {
  handleEmailInput();
  handlePasswordInput();
  return !errors.email && !errors.password;
};

const showSuspendedAccountMessage = () => {
  toastStore.error(SUSPENDED_ACCOUNT_MESSAGE);
};

const syncLoginMessage = () => {
  const storedMessage = consumeSuspendedAccountMessage();

  if (storedMessage || route.query.reason === SUSPENDED_ACCOUNT_REASON) {
    showSuspendedAccountMessage();
  }
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;

  try {
    const userData = await authStore.login({
      email: email.value,
      password: password.value,
    });

    toastStore.success(
      `ការចូលប្រើប្រាស់បានជោគជ័យ, ${userData.fullName || userData.email}!`,
    );

    router.push("/dashboard");
  } catch (err) {
    if (isSuspendedAccountException(err)) {
      showSuspendedAccountMessage();
      return;
    }

    const message = err.response?.data?.message || err.message || "";

    if (
      message.toLowerCase().includes("invalid email") ||
      message.toLowerCase().includes("invalid password") ||
      message.toLowerCase().includes("invalid email or password")
    ) {
      const invalidMessage = "អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ";
      toastStore.error(invalidMessage);
    } else {
      const fallbackMessage = "មិនអាចចូលគណនីបានទេ";
      toastStore.error(fallbackMessage);
    }
  } finally {
    loading.value = false;
  }
};

onMounted(syncLoginMessage);

watch(
  () => route.query.reason,
  () => {
    syncLoginMessage();
  },
);
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap");
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

.khmer-font {
  font-family:
    "Kantumruy Pro",
    -apple-system,
    sans-serif;
}

.left-branding-panel {
  background-color: #2d5046;
  background-image:
    radial-gradient(at 0% 0%, rgba(90, 150, 136, 0.45) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(33, 62, 54, 0.8) 0px, transparent 70%),
    linear-gradient(135deg, #386357 0%, #223f37 100__);
}
</style>
