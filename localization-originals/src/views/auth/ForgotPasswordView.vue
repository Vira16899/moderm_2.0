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
            class="text-[2.4rem] font-black text-white mb-1 tracking-[3px]"
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
            ប្រព័ន្ធផ្ទៀងផ្ទាត់ និងស្ដារគណនីឡើងវិញ ដើម្បីធានាថាទិន្នន័យ
            និងការប្រើប្រាស់របស់អ្នកមានសុវត្ថិភាពជានិច្ច។
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
          <button
            type="button"
            @click="router.push('/login')"
            class="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-[#5A9688] dark:hover:text-[#5A9688] mb-6 transition-colors border-0 bg-transparent p-0 cursor-pointer"
          >
            <ArrowLeftIcon class="w-4 h-4" />
            <span>ត្រឡប់ទៅទំព័រចូលគណនី</span>
          </button>

          <div v-if="step === 'email'">
            <div class="mb-8 text-center">
              <div
                class="w-20 h-20 bg-white dark:bg-white/10 flex items-center justify-center rounded-full mb-4 mx-auto shadow-[0_4px_20px_rgba(90,150,136,0.25)]"
              >
                <MailIcon class="w-10 h-10 text-[#5A9688]" />
              </div>
              <span
                class="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide"
                >ប្រព័ន្ធសុវត្ថិភាព</span
              >
              <h2
                class="text-3xl font-bold text-gray-800 dark:text-white mt-1 mb-2"
              >
                ភ្លេចពាក្យសម្ងាត់
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-xs px-2">
                បញ្ចូលអុីម៉ែលរបស់អ្នក
                ដើម្បីទទួលបានតំណភ្ជាប់កំណត់ពាក្យសម្ងាត់ថ្មី biographies។
              </p>
            </div>

            <form
              novalidate
              @submit.prevent="handleSubmitEmail"
              class="space-y-5"
            >
              <div>
                <label
                  class="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-2"
                  >អុីម៉ែល <span class="text-red-500">*</span></label
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
                    placeholder="បញ្ចូលអុីម៉ែលរបស់អ្នក"
                    class="w-full py-3.5 pl-11 pr-4 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-transparent rounded-xl transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#5A9688] focus:ring-4 focus:ring-[#5A9688]/15"
                    :class="{
                      '!border-red-500 !bg-red-50 dark:!bg-red-500/5 focus:ring-red-500/15':
                        emailError,
                    }"
                    required
                    @input="handleEmailInput"
                  />
                </div>
                <p
                  v-if="emailError"
                  class="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"
                >
                  <i class="bi bi-exclamation-circle-fill"></i> {{ emailError }}
                </p>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full py-3.5 bg-[#5A9688] hover:bg-[#4a7d71] text-white font-bold rounded-xl shadow-lg shadow-[#5A9688]/20 transition-all duration-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="loading"
                  class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                ></span>
                <span>{{ loading ? "កំពុងដំណើរការ..." : "បន្តទៅមុខ" }}</span>
                <i v-if="!loading" class="bi bi-arrow-right-short text-xl"></i>
              </button>
            </form>
          </div>

          <div v-else-if="step === 'linkSent'">
            <div class="mb-8 text-center">
              <div
                class="w-20 h-20 bg-white dark:bg-white/10 flex items-center justify-center rounded-full mb-4 mx-auto shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
              >
                <CheckCircleIcon class="w-10 h-10 text-emerald-500" />
              </div>
              <span class="text-xs text-[#5A9688] font-medium tracking-wide"
                >ផ្ញើជោគជ័យ</span
              >
              <h2
                class="text-3xl font-bold text-gray-800 dark:text-white mt-1 mb-2"
              >
                ពិនិត្យអ៊ីម៉ែល
              </h2>

              <p
                v-if="successMessage"
                class="text-gray-500 dark:text-gray-400 text-xs px-2 leading-relaxed"
              >
                {{ successMessage }}
              </p>
              <p
                class="text-gray-500 dark:text-gray-400 text-xs px-2 leading-relaxed"
              >
                តំណភ្ជាប់សម្រាប់កំណត់ពាក្យសម្ងាត់ថ្មី ត្រូវបានផ្ញើទៅកាន់អុីម៉ែល
                <br />
                <span
                  class="font-bold text-gray-700 dark:text-white bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded mt-1 inline-block"
                  >{{ email }}</span
                >
                រួចរាល់ហើយ។
              </p>
            </div>

            <div class="space-y-4">
              <a
                href="https://mail.google.com/"
                target="_blank"
                class="w-full py-3.5 bg-[#5A9688] hover:bg-[#4a7d71] text-white font-bold rounded-xl shadow-lg shadow-[#5A9688]/20 transition-all duration-200 flex items-center justify-center gap-2 no-underline text-sm"
              >
                <i class="bi bi-envelope-check text-base"></i>
                <span>បើកប្រអប់សំបុត្រ Gmail</span>
              </a>

              <button
                v-if="resetToken"
                type="button"
                @click="step = 'resetPassword'"
                class="w-full text-[#5A9688] border border-[#5A9688] bg-transparent py-3.5 rounded-xl font-bold hover:bg-[#5A9688]/5 transition-all duration-200 shadow-sm text-sm"
              >
                បន្តទៅកំណត់ពាក្យសម្ងាត់ថ្មី
              </button>

              <div class="text-center pt-2">
                <button
                  type="button"
                  @click="step = 'email'"
                  class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-semibold transition-colors bg-transparent border-0"
                >
                  មិនបានទទួលលេខកូដ? ផ្ញើតំណភ្ជាប់ម្តងទៀត
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="step === 'resetPassword'">
            <div class="mb-8 text-center">
              <div
                class="w-20 h-20 bg-white dark:bg-white/10 flex items-center justify-center rounded-full mb-4 mx-auto shadow-[0_4px_20px_rgba(90,150,136,0.25)]"
              >
                <LockIcon class="w-10 h-10 text-[#5A9688]" />
              </div>
              <span
                class="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide"
                >ជំហានចុងក្រោយ</span
              >
              <h2
                class="text-3xl font-bold text-gray-800 dark:text-white mt-1 mb-2"
              >
                ពាក្យសម្ងាត់ថ្មី
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-xs px-4">
                សូមបញ្ចូលពាក្យសម្ងាត់ថ្មីដែលអ្នកចង់ប្រើប្រាស់បន្ត។
              </p>
            </div>

            <form
              novalidate
              @submit.prevent="handleResetPassword"
              class="space-y-5"
            >
              <div>
                <label
                  class="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-2"
                  >ពាក្យសម្ងាត់ថ្មី <span class="text-red-500">*</span></label
                >
                <div class="relative flex items-center">
                  <span
                    class="absolute left-4 z-10 pointer-events-none text-gray-400 dark:text-gray-500 flex items-center"
                  >
                    <i class="bi bi-lock"></i>
                  </span>
                  <input
                    v-model="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="យ៉ាងហោច ៨ តួអក្សរ"
                    class="w-full py-3.5 pl-11 pr-12 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-transparent rounded-xl transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#5A9688] focus:ring-4 focus:ring-[#5A9688]/15"
                    :class="{
                      '!border-red-500 !bg-red-50 dark:!bg-red-500/5 focus:ring-red-500/15':
                        passwordErrors.newPassword,
                    }"
                    required
                    @input="handleNewPasswordInput"
                  />
                  <button
                    type="button"
                    @click="showNewPassword = !showNewPassword"
                    class="absolute right-4 z-10 text-gray-400 dark:text-gray-500 hover:text-[#5A9688] dark:hover:text-[#5A9688] transition-colors"
                  >
                    <i
                      :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                    ></i>
                  </button>
                </div>
                <p
                  v-if="passwordErrors.newPassword"
                  class="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1"
                >
                  <i class="bi bi-exclamation-circle-fill"></i>
                  {{ passwordErrors.newPassword }}
                </p>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full py-3.5 bg-[#5A9688] hover:bg-[#4a7d71] text-white font-bold rounded-xl shadow-lg shadow-[#5A9688]/20 transition-all duration-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="loading"
                  class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                ></span>
                <span>{{
                  loading ? "កំពុងរក្សាទុក..." : "ផ្លាស់ប្តូរពាក្យសម្ងាត់"
                }}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import Toast from "@/components/common/Toast.vue";
import { useTheme } from "@/composables/useTheme";
import {
  ArrowLeft as ArrowLeftIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();
const { isDark } = useTheme();

const step = ref("email");
const email = ref("");
const resetToken = ref("");
const successMessage = ref("");
const newPassword = ref("");
const showNewPassword = ref(false);
const emailError = ref("");
const passwordErrors = reactive({ newPassword: "" });
const loading = ref(false);

const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

const getSuccessMessage = (response, fallback) =>
  response.data?.message ||
  response.data?.data?.message ||
  response.data?.status ||
  fallback;

const getQueryValue = (value) =>
  Array.isArray(value) ? value[0] : value || "";

onMounted(() => {
  email.value = getQueryValue(route.query.email);
  resetToken.value =
    getQueryValue(route.params.token) ||
    getQueryValue(route.query.token) ||
    getQueryValue(route.query.reset_token) ||
    getQueryValue(route.query.code);

  if (resetToken.value) {
    step.value = "resetPassword";
  }
});

// --- អនុគមន៍ផ្ទៀងផ្ទាត់ Real-time ---

const handleEmailInput = () => {
  if (!email.value) {
    emailError.value = "សូមបញ្ចូលអុីមែលរបស់អ្នក";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email.value))) {
    emailError.value = "ទម្រង់អ៊ីម៉ែលមិនត្រឹមត្រូវ";
  } else {
    emailError.value = "";
  }
};

const handleNewPasswordInput = () => {
  if (!newPassword.value) {
    passwordErrors.newPassword = "សូមបញ្ចូលពាក្យសម្ងាត់របស់អ្នក";
  } else if (newPassword.value.length < 8) {
    passwordErrors.newPassword = "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ";
  } else {
    passwordErrors.newPassword = "";
  }
};

// --- អនុគមន៍ពេលចុច Submit ---

const handleSubmitEmail = async () => {
  handleEmailInput();

  if (emailError.value) return;

  loading.value = true;

  try {
    await authStore.forgotPassword(email.value);

    const khmerMessage =
      "ប្រសិនបើមានគណនីដែលប្រើអ៊ីមែលនេះ តំណភ្ជាប់សម្រាប់កំណត់ពាក្យសម្ងាត់ថ្មី ត្រូវបានផ្ញើរួចហើយ។";

    successMessage.value = khmerMessage;

    toastStore.success(khmerMessage);

    step.value = "linkSent";
  } catch (err) {
    toastStore.error("មិនអាចផ្ញើតំណភ្ជាប់សម្រាប់កំណត់ពាក្យសម្ងាត់ថ្មីបានទេ");
  } finally {
    loading.value = false;
  }
};

const handleResetPassword = async () => {
  handleNewPasswordInput();

  if (passwordErrors.newPassword) return;

  if (!resetToken.value) {
    toastStore.error("Missing reset token.");
    return;
  }

  loading.value = true;

  try {
    await authStore.resetPassword({
      token: resetToken.value,
      newPassword: newPassword.value,
    });

    successMessage.value = "ពាក្យសម្ងាត់ត្រូវបានកំណត់ឡើងវិញដោយជោគជ័យ។";
    toastStore.success(successMessage.value);

    newPassword.value = "";
    router.replace("/login");
  } catch (err) {
    toastStore.error(getErrorMessage(err, "Unable to reset password."));
  } finally {
    loading.value = false;
  }
};
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

/* Linear Gradient Background សម្រាប់ Left Panel ដូចទំព័រ Login */
.left-branding-panel {
  background-color: #2d5046;
  background-image:
    radial-gradient(at 0% 0%, rgba(90, 150, 136, 0.45) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(33, 62, 54, 0.8) 0px, transparent 70%),
    linear-gradient(135deg, #386357 0%, #223f37 100__);
}
</style>
