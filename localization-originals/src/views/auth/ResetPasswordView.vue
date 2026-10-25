<template>
  <div
    class="min-vh-100 d-flex align-items-center justify-content-center bg-light-gray p-3 p-md-4 khmer-font"
  >
    <div
      class="row g-0 w-100 shadow-lg rounded-5 overflow-hidden bg-white main-wrapper"
    >
      <div
        class="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative left-branding-panel"
      >
        <div class="d-flex flex-column align-items-center text-center mt-3">
          <div
            class="logo-box d-flex align-items-center justify-content-center bg-white rounded-4 shadow mb-4"
          >
            <img src="@/assets/logo.png" alt="Logo" class="logo-img" />
          </div>
          <h1
            class="fw-black text-white mb-1 system-name-title"
            style="color: aliceblue"
          >
            NOAM-SAR
          </h1>
          <span
            class="fw-semibold text-white-50 tracking-widest system-sub-title"
            >STAFF ALERT SYSTEM</span
          >
        </div>

        <div class="my-auto py-5 text-center w-100">
          <p class="text-white-60 fs-6 fw-light mx-auto description-max-width">
            សូមបង្កើតពាក្យសម្ងាត់ថ្មីដែលមានកម្រិតសុវត្ថិភាពខ្ពស់
            ដើម្បីការពារទិន្នន័យ និងគណនីរបស់អ្នកក្នុងការប្រើប្រាស់បន្ត។
          </p>
        </div>

        <div class="graphic-node-map position-relative mt-auto">
          <div
            class="node-main d-flex align-items-center justify-content-center rounded-4 shadow"
          >
            <i class="bi bi-shield-lock-fill fs-3 text-white"></i>
          </div>
          <div class="node-line line-1"></div>
          <div class="node-line line-2"></div>
          <div class="node-line line-3"></div>

          <div
            class="node-child child-1 rounded-3 shadow-sm d-flex align-items-center justify-content-center"
          >
            <i class="bi bi-bell-fill text-warning fs-5"></i>
          </div>
          <div
            class="node-child child-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center"
          >
            <i class="bi bi-people-fill text-success fs-5"></i>
          </div>
          <div
            class="node-child child-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center"
          >
            <i class="bi bi-patch-check-fill text-primary fs-5"></i>
          </div>
        </div>
      </div>

      <div
        class="col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5 position-relative"
      >
        <div class="w-100 form-inner-container">
          <button
            @click="router.push('/')"
            class="btn btn-back-link text-decoration-none d-flex align-items-center gap-2 p-0 mb-4 fw-semibold"
          >
            <i class="bi bi-arrow-left"></i> ត្រឡប់ក្រោយ
          </button>

          <div class="mb-4 text-center">
            <div
              class="icon-header-badge d-flex align-items-center justify-center rounded-circle mb-3 mx-auto"
            >
              <span class="lock-emoji"><i class="bi bi-shield-lock"></i></span>
            </div>
            <h2 class="fw-bold text-dark khmer-title-font mb-2 fs-2">
              បង្កើតពាក្យសម្ងាត់ថ្មី
            </h2>
            <p class="text-muted small mb-4">
              បញ្ចូលពាក្យសម្ងាត់ថ្មីដែលអ្នកចង់ប្រើប្រាស់បន្ត biographies។
            </p>
          </div>

          <div
            v-if="!hasToken"
            class="alert alert-custom-danger mb-4 d-flex align-items-start gap-2"
            role="alert"
          >
            <i class="bi bi-exclamation-triangle-fill mt-1"></i>
            <div>
              សូមចុចតំណនៅក្នុងអ៊ីមែលដែលបានផ្ញើទៅអ្នក
              ដើម្បីបន្តការកំណត់ពាក្យសម្ងាត់ថ្មី។
            </div>
          </div>

          <div
            v-if="authStore.message_error"
            class="alert alert-custom-danger mb-4 d-flex align-items-start gap-2"
            role="alert"
          >
            <i class="bi bi-x-circle-fill mt-1"></i>
            <div>{{ authStore.message_error }}</div>
          </div>

          <form @submit.prevent="handleResetPassword" novalidate>
            <div class="mb-4">
              <label
                class="form-label small fw-semibold text-secondary-color mb-2"
                >ពាក្យសម្ងាត់ថ្មី</label
              >
              <div class="input-group-custom position-relative">
                <span class="input-icon-left"
                  ><i class="bi bi-lock text-muted"></i
                ></span>
                <input
                  v-model="newPassword"
                  :type="isPassVisible ? 'text' : 'password'"
                  placeholder="យ៉ាងហោច ៨ តួអក្សរ"
                  class="form-control-custom form-control-password"
                  :class="{ 'is-invalid-custom': passwordErrors.newPassword }"
                  @input="
                    passwordErrors.newPassword = '';
                    authStore.message_error = '';
                  "
                />
                <button
                  type="button"
                  class="input-icon-right border-0 bg-transparent"
                  @click="isPassVisible = !isPassVisible"
                >
                  <i
                    :class="
                      isPassVisible
                        ? 'bi bi-eye-slash text-muted'
                        : 'bi bi-eye text-muted'
                    "
                  ></i>
                </button>
              </div>
              <div
                v-if="passwordErrors.newPassword"
                class="error-msg-hint mt-1 small"
              >
                <i class="bi bi-exclamation-circle-fill me-1"></i
                >{{ passwordErrors.newPassword }}
              </div>
            </div>

            <button
              type="submit"
              :disabled="loading || !hasToken"
              class="btn btn-submit-prime w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 mt-4"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm text-light"
                role="status"
              ></span>
              <span>{{
                loading ? "កំពុងផ្លាស់ប្តូរ..." : "ប្តូរពាក្យសម្ងាត់"
              }}</span>
              <i v-if="!loading" class="bi bi-check-circle fs-5 ms-1"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/useAuth";
import { useToast } from "vue-toastification";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const token = computed(() => route.params.token || route.query.token || "");
const newPassword = ref("");
const passwordErrors = reactive({ newPassword: "" });
const loading = ref(false);

const isPassVisible = ref(false);

const hasToken = computed(() => !!token.value);

const toastConfig = {
  timeout: 3000,
  position: "top-right",
  toastClassName: "custom-toast-large",
};

const handleResetPassword = async () => {
  if (newPassword.value.length < 8) {
    passwordErrors.newPassword = "Password must be at least 8 characters.";
    return;
  }

  if (!hasToken.value) {
    toast.error("Missing reset token.", toastConfig);
    return;
  }

  loading.value = true;

  try {
    await authStore.resetPassword(token.value, newPassword.value);

    toast.success("Password has been reset successfully!", toastConfig);

    newPassword.value = "";

    setTimeout(() => {
      router.replace("/");
    }, 1500);
  } catch (error) {
    authStore.message_error = error?.message || "Unable to reset password.";
    toast.error(authStore.message_error, toastConfig);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap");
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

/* Layout Basics & Typography System */
.khmer-font {
  font-family:
    "Kantumruy Pro",
    -apple-system,
    sans-serif;
}
.khmer-title-font {
  font-weight: 700 !important;
}
.bg-light-gray {
  background-color: #f4f7f6;
}

/* Identical wrapper thresholds to avoid stretching anomalies */
.main-wrapper {
  width: 100%;
  max-width: 980px;
  min-height: 620px;
}
.form-inner-container {
  width: 100%;
  max-width: 360px;
}

/* Left Panel Canvas Branding Elements */
.left-branding-panel {
  background-color: #2d5046;
  background-image:
    radial-gradient(at 0% 0%, rgba(90, 150, 136, 0.45) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(33, 62, 54, 0.8) 0px, transparent 70%),
    linear-gradient(135deg, #386357 0%, #223f37 100__);
}
.logo-box {
  width: 120px;
  height: 120px;
  border-radius: 60px !important;
}
.logo-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 50px;
}
.system-name-title {
  font-size: 2.4rem;
  letter-spacing: 3px;
  font-weight: 900 !important;
}
.system-sub-title {
  font-size: 0.85rem;
  letter-spacing: 5px;
  opacity: 0.7;
}
.description-max-width {
  max-width: 360px;
  line-height: 1.6;
}

/* Custom Interactive Controlled Input Styling Fields */
.secondary-color {
  color: #4a5568;
}
.input-group-custom {
  position: relative;
  display: flex;
  align-items: center;
}
.form-control-custom {
  width: 100%;
  padding: 14px 16px 14px 44px;
  font-size: 0.95rem;
  color: #2d3748;
  background-color: #edf2f7;
  border: 2px solid transparent;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.form-control-password {
  padding-right: 48px !important;
}
.form-control-custom:focus {
  outline: none;
  background-color: #ffffff;
  border-color: #5a9688;
  box-shadow: 0 0 0 4px rgba(90, 150, 136, 0.15);
}
.input-icon-left {
  position: absolute;
  left: 16px;
  z-index: 4;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.input-icon-right {
  position: absolute;
  right: 16px;
  z-index: 4;
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* Customized Warning Alert Framework layout */
.alert-custom-danger {
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  color: #c53030;
  border-radius: 12px;
  font-size: 0.88rem;
  padding: 12px 16px;
}

/* Error Constraints Handling States */
.is-invalid-custom {
  border-color: #e53e3e !important;
  background-color: #fff5f5 !important;
}
.is-invalid-custom:focus {
  box-shadow: 0 0 0 4px rgba(229, 62, 62, 0.15) !important;
}
.error-msg-hint {
  color: #e53e3e;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Header Circle Shield Lock Badge components */
.icon-header-badge {
  width: 80px;
  height: 80px;
  background-color: #ffffff;
  border-radius: 50% !important;
  box-shadow: 0 4px 20px rgba(90, 150, 136, 0.25);
}
.lock-emoji {
  font-size: 2.5rem;
  line-height: 1;
  color: #5a9688;
}

/* Action Hyperlink Element Configurations */
.btn-back-link {
  color: #5a9688;
  transition: all 0.2s ease;
}
.btn-back-link:hover {
  color: #3f6b61;
  transform: translateX(-2px);
}

/* Primary Form Submit Button Rules */
.btn-submit-prime {
  background-color: #5a9688;
  color: #ffffff !important;
  border: none;
  border-radius: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(90, 150, 136, 0.25);
}
.btn-submit-prime:hover:not(:disabled) {
  background-color: #4a7d71;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(90, 150, 136, 0.35);
}
.btn-submit-prime:active:not(:disabled) {
  transform: translateY(1px);
}
.btn-submit-prime:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* CSS Decorative Abstract Layout Graphic Nodes Diagram Design */
.graphic-node-map {
  height: 140px;
  width: 100%;
}
.node-main {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: absolute;
  left: 20px;
  top: 40px;
  z-index: 3;
}
.node-child {
  width: 44px;
  height: 44px;
  background: #ffffff;
  position: absolute;
  z-index: 3;
}
.child-1 {
  left: 180px;
  top: 0px;
}
.child-2 {
  left: 230px;
  top: 48px;
}
.child-3 {
  left: 160px;
  top: 96px;
}

.node-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.25);
  height: 2px;
  transform-origin: left center;
  z-index: 1;
}
.line-1 {
  left: 76px;
  top: 68px;
  width: 110px;
  transform: rotate(-25deg);
}
.line-2 {
  left: 76px;
  top: 68px;
  width: 155px;
  transform: rotate(2deg);
}
.line-3 {
  left: 76px;
  top: 68px;
  width: 95px;
  transform: rotate(30deg);
}

/* Custom Overrides for Vue-Toastification elements */
:deep(.custom-toast-success) {
  background-color: #5a9688 !important;
  font-family: "Kantumruy Pro", sans-serif !important;
  font-size: 15px !important;
  font-weight: 500 !important;
  border-radius: 12px !important;
  padding: 18px 24px !important;
  min-height: 64px !important;
  box-shadow: 0 6px 18px rgba(90, 150, 136, 0.2) !important;
}

:deep(.custom-toast-error) {
  background-color: #e53e3e !important;
  font-family: "Kantumruy Pro", sans-serif !important;
  font-size: 15px !important;
  font-weight: 500 !important;
  border-radius: 12px !important;
  padding: 18px 24px !important;
  min-height: 64px !important;
  box-shadow: 0 6px 18px rgba(229, 62, 62, 0.2) !important;
}

:deep(.custom-toast-success) .Vue-Toastification__toast-body,
:deep(.custom-toast-success) .Vue-Toastification__close-button,
:deep(.custom-toast-success) .Vue-Toastification__icon,
:deep(.custom-toast-error) .Vue-Toastification__toast-body,
:deep(.custom-toast-error) .Vue-Toastification__close-button,
:deep(.custom-toast-error) .Vue-Toastification__icon {
  color: #ffffff !important;
}

:deep(.Vue-Toastification__toast--success.custom-toast-success) {
  background-color: #5a9688 !important;
}
:deep(.Vue-Toastification__toast--error.custom-toast-error) {
  background-color: #e53e3e !important;
}
</style>
