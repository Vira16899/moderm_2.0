<template>
  <div class="profile-page space-y-6">
    <div class="mb-8">
      <h1 class="text-3xl font-normal text-gray-900 mb-2">
        ព័ត៌មានផ្ទាល់ខ្លួន
      </h1>
      <p class="text-gray-500">មើល និងគ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នក</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Profile Card -->
      <div class="profile-card bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <div class="flex flex-col items-center">
          <div class="profile-avatar-stage mb-5">
            <button
              type="button"
              @click="triggerFileInput"
              :disabled="isUpdatingAvatar"
              class="avatar-action-btn avatar-action-btn--upload"
              aria-label="Upload avatar"
              title="Upload avatar"
            >
              <UploadIcon class="w-4 h-4" />
            </button>

            <div
              class="profile-avatar w-32 h-32 rounded-full bg-[#84A98C] flex items-center justify-center text-white text-3xl font-normal shadow-lg overflow-hidden"
            >
              <img
                v-if="user?.avatar"
                :src="user.avatar"
                class="w-full h-full object-cover"
                alt="Avatar"
              />
              <span v-else>
                {{ user?.fullName?.charAt(0) || "U" }}
              </span>
              <div v-if="isUpdatingAvatar" class="avatar-loading">
                <span class="avatar-spinner"></span>
              </div>
            </div>

            <button
              type="button"
              v-if="user?.avatar"
              @click="showDeleteAvatarDialog = true"
              :disabled="isUpdatingAvatar"
              class="avatar-action-btn avatar-action-btn--delete"
              aria-label="Delete avatar"
              title="Delete avatar"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
            <span v-else class="avatar-action-spacer" aria-hidden="true"></span>
          </div>
          <h2 class="text-xl font-normal text-gray-900 mb-1">
            {{ user?.fullName }}
          </h2>
          <p class="text-sm text-gray-500 mb-4">{{ user?.email }}</p>
          <StatusBadge :status="user?.role" variant="info" />

          <div class="mt-8 w-full space-y-3">
            <button
              @click="showEditModal = true"
              class="profile-action-btn profile-action-btn--primary "
            >
              កែប្រែព័ត៌មាន
            </button>

            <button
              @click="showPasswordModal = true"
              class="profile-action-btn profile-action-btn--indigo "
            >
              <LockIcon class="w-4 h-4" />
              ប្តូរពាក្យសម្ងាត់
            </button>

            <button
              @click="showEmailModal = true"
              class="profile-action-btn profile-action-btn--emerald"
            >
              <MailIcon class="w-4 h-4" />
              ប្តូរអ៊ីមែល
            </button>

            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept="image/*"
              @change="handleFileUpload"
            />
            <button @click="triggerFileInput" class="hidden">
              <UploadIcon class="w-4 h-4" />
              ប្តូររូបភាព
            </button>

            <button
              v-if="user?.avatar"
              @click="showDeleteAvatarDialog = true"
              class="hidden"
            >
              <Trash2Icon class="w-4 h-4" />
              លុបរូបភាព
            </button>

            <button
              @click="openDeleteAccountModal"
              :disabled="isProtectedAdmin"
              :title="
                isProtectedAdmin
                  ? 'Admin account ID 1 cannot delete its own account.'
                  : 'Delete account'
              "
              class="profile-action-btn profile-action-btn--danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2Icon class="w-4 h-4" />
              លុបគណនី
            </button>
          </div>
        </div>
      </div>

      <!-- Info Card -->
      <div
        class="profile-info-card lg:col-span-2 bg-white border border-gray-100 rounded-xl p-8 shadow-sm"
      >
        <h3 class="text-xl font-normal text-gray-900 mb-8">ព័ត៌មានលម្អិត</h3>

        <div class="profile-info-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="info in personalInfo" :key="info.label" class="profile-info-item">
            <label class="profile-info-label flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span class="profile-info-icon">
                <component :is="info.icon" class="w-4 h-4" />
              </span>
              {{ info.label }}
            </label>
            <div v-if="info.isBadge">
              <StatusBadge :status="info.value" />
            </div>
            <p v-else class="text-gray-900 font-normal">
              {{ info.value || "មិនមាន" }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <ProfileEditModal
      :is-open="showEditModal"
      :loading="isUpdatingProfile"
      :initial-data="formData"
      @close="showEditModal = false"
      @submit="handleUpdateProfile"
    />

    <!-- Change Password Modal -->
    <ChangePasswordModal
      :is-open="showPasswordModal"
      :loading="isUpdatingPassword"
      :initial-data="passwordData"
      @close="closePasswordModal"
      @submit="handleUpdatePassword"
    />

    <!-- Change Email Modal -->
    <ChangeEmailModal
      :is-open="showEmailModal"
      :loading="isUpdatingEmail"
      :initial-data="emailData"
      @close="closeEmailModal"
      @submit="handleUpdateEmail"
    />

    <!-- Email Sent Modal -->
    <EmailSentModal
      :is-open="showEmailSentModal"
      :email="sentEmail"
      @close="showEmailSentModal = false"
    />

    <!-- Delete Account Confirm -->
    <DeleteAccountModal
      :is-open="showDeleteDialog"
      :loading="isDeletingAccount"
      @close="showDeleteDialog = false"
      @submit="handleDeleteAccount"
    />

    <!-- Delete Avatar Confirm -->
    <ConfirmDialog
      :is-open="showDeleteAvatarDialog"
      title="លុបរូបភាព"
      message="តើអ្នកប្រាកដជាចង់លុបរូបភាព Profile របស់អ្នកមែនទេ?"
      confirm-text="លុបរូបភាព"
      variant="warning"
      @close="showDeleteAvatarDialog = false"
      @confirm="handleDeleteAvatar"
    />
    <!-- Avatar Cropper Modal -->
    <AvatarCropperModal
      :is-open="showCropperModal"
      :image="cropperImage"
      @close="showCropperModal = false"
      @crop="handleCropAvatar"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import {
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Calendar as CalendarIcon,
  DollarSign as DollarSignIcon,
  Shield as ShieldIcon,
  Upload as UploadIcon,
  Trash2 as Trash2Icon,
  Lock as LockIcon,
} from "lucide-vue-next";
import StatusBadge from "@/components/common/StatusBadge.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import ProfileEditModal from "@/components/ui/base/ProfileEditModal.vue";
import ChangePasswordModal from "@/components/ui/base/ChangePasswordModal.vue";
import ChangeEmailModal from "@/components/ui/base/ChangeEmailModal.vue";
import EmailSentModal from "@/components/ui/base/EmailSentModal.vue";
import DeleteAccountModal from "@/components/ui/base/DeleteAccountModal.vue";
import AvatarCropperModal from "@/components/ui/base/AvatarCropperModal.vue";

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();
const showCropperModal = ref(false);
const cropperImage = ref("");


const user = computed(() => authStore.user);
const showEditModal = ref(false);
const showPasswordModal = ref(false);
const showEmailModal = ref(false);
const showEmailSentModal = ref(false);
const sentEmail = ref("");
const showDeleteDialog = ref(false);
const showDeleteAvatarDialog = ref(false);
const fileInput = ref(null);
const isLoadingProfile = ref(false);
const isUpdatingProfile = ref(false);
const isUpdatingAvatar = ref(false);
const isUpdatingPassword = ref(false);
const isUpdatingEmail = ref(false);
const isDeletingAccount = ref(false);

const formData = reactive({
  fullName: user.value?.fullName || "",
  phoneNumber: user.value?.phoneNumber || "",
  gender: user.value?.gender || "",
});

const passwordData = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const emailData = reactive({
  newEmail: "",
  password: "",
});


const isProtectedAdmin = computed(() => {
  const userId = user.value?.id ?? user.value?.userId ?? user.value?.user_id;
  return Number(userId) === 1;
});

const isAdminProfile = computed(() => {
  const role = String(
    user.value?.role || user.value?.roleName || user.value?.role_name || "",
  )
    .trim()
    .toUpperCase();
  const roleId = Number(
    user.value?.roleId ?? user.value?.role_id ?? user.value?.role?.id,
  );

  return role === "ADMIN" || roleId === 1;
});

const closePasswordModal = () => {
  showPasswordModal.value = false;
  passwordData.currentPassword = "";
  passwordData.newPassword = "";
  passwordData.confirmPassword = "";
};

const closeEmailModal = () => {
  showEmailModal.value = false;
  emailData.newEmail = "";
  emailData.password = "";
};

const openDeleteAccountModal = () => {
  if (isProtectedAdmin.value) {
    toastStore.error("Admin account ID 1 cannot delete its own account.");
    return;
  }

  showDeleteDialog.value = true;
};

const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

const normalizeGender = (gender) => {
  const value = String(gender || "")
    .trim()
    .toUpperCase();
  return value === "MALE" || value === "FEMALE" ? value : "";
};

const syncProfileForm = (profile) => {
  formData.fullName = profile?.fullName || "";
  formData.phoneNumber = profile?.phoneNumber || "";
  formData.gender = normalizeGender(profile?.gender);
};

const loadProfile = async () => {
  isLoadingProfile.value = true;
  try {
    const profile = await authStore.fetchProfile();
    syncProfileForm(profile);
  } catch (err) {
    toastStore.error(
      getErrorMessage(err, "មិនអាចទាញយកព័ត៌មានកម្រងរូបភាពបានទេ"),
    );
  } finally {
    isLoadingProfile.value = false;
  }
};

const handleUpdatePassword = async (data) => {
  if (data.newPassword.length < 8) {
    toastStore.error("ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ");
    return;
  }

  if (data.newPassword !== data.confirmPassword) {
    toastStore.error("ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ");
    return;
  }

  isUpdatingPassword.value = true;

  try {
    await authStore.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    toastStore.success("ប្តូរពាក្យសម្ងាត់បានជោគជ័យ");

    closePasswordModal();

    authStore.logout();

    router.push("/login");

  } catch (err) {

    const message =
      err.response?.data?.message ||
      err.message ||
      "";

    if (
      message.toLowerCase().includes("invalid") ||
      message.toLowerCase().includes("incorrect")
    ) {

      toastStore.error("ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ");

    } else if (
      message.toLowerCase().includes("same password")
    ) {

      toastStore.error("ពាក្យសម្ងាត់ថ្មីមិនអាចដូចពាក្យសម្ងាត់ចាស់បានទេ");

    } else {

      toastStore.error("មិនអាចប្តូរពាក្យសម្ងាត់បានទេ");

    }

  } finally {
    isUpdatingPassword.value = false;
  }
};

const handleUpdateEmail = async (data) => {
  if (!data.newEmail || !data.password) {
    toastStore.error("សូមបញ្ចូលអ៊ីមែលថ្មី និងពាក្យសម្ងាត់");
    return;
  }

  if (data.newEmail === user.value?.email) {
    toastStore.error("អ៊ីមែលថ្មីមិនអាចដូចនឹងអ៊ីមែលបច្ចុប្បន្នទេ");
    return;
  }

  isUpdatingEmail.value = true;

  try {
    await authStore.changeEmail({
      newEmail: data.newEmail,
      password: data.password,
    });

    sentEmail.value = data.newEmail;

    localStorage.setItem(
      "pending-email-change",
      data.newEmail
    );

    showEmailSentModal.value = true;

    closeEmailModal();

  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.message ||
      "";

    if (
      message.toLowerCase().includes("invalid password")
    ) {
      toastStore.error("ពាក្យសម្ងាត់មិនត្រឹមត្រូវ");
    } else if (
      message.toLowerCase().includes("email already exists")
    ) {
      toastStore.error("អ៊ីមែលនេះត្រូវបានប្រើរួចហើយ");
    } else {
      toastStore.error("មិនអាចប្តូរអ៊ីមែលបានទេ");
    }

  } finally {
    isUpdatingEmail.value = false;
  }
};

const handleUpdateProfile = async (data) => {
  isUpdatingProfile.value = true;
  try {
    await authStore.updateProfile({
      fullname: data.fullName,
      phone: data.phoneNumber,
      gender: normalizeGender(data.gender),
    });
    toastStore.success("កែប្រែព័ត៌មានបានជោគជ័យ");
    showEditModal.value = false;
  } catch (err) {
    toastStore.error(getErrorMessage(err, "មិនអាចកែប្រែព័ត៌មានបានទេ"));
  } finally {
    isUpdatingProfile.value = false;
  }
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toastStore.error("សូមជ្រើសរើសរូបភាព");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    toastStore.error("រូបភាព Profile ត្រូវតែមានទំហំតូចជាង ២MB");
    return;
  }

  // clear old preview
  if (cropperImage.value) {
    URL.revokeObjectURL(cropperImage.value);
  }

  cropperImage.value = URL.createObjectURL(file);

  showCropperModal.value = true;

  event.target.value = "";
};


const handleCropAvatar = async (file) => {
  if (!file) {
    toastStore.error("មិនមានរូបភាព");
    return;
  }

  isUpdatingAvatar.value = true;

  try {
    await authStore.uploadAvatar(file);

    toastStore.success("ប្តូររូបភាពបានជោគជ័យ");

    showCropperModal.value = false;

    // clear old blob url
    if (cropperImage.value) {
      URL.revokeObjectURL(cropperImage.value);
    }

    cropperImage.value = "";

  } catch (err) {
    // ignore request aborted error
    if (
      err?.message?.includes("aborted") ||
      err?.code === "ERR_CANCELED"
    ) {
      return;
    }

    toastStore.error(
      err.response?.data?.message ||
      "មិនអាចប្តូររូបភាពបានទេ"
    );

  } finally {
    isUpdatingAvatar.value = false;
  }
};

const handleDeleteAvatar = async () => {
  isUpdatingAvatar.value = true;
  try {
    await authStore.deleteAvatar();
    toastStore.success("លុបរូបភាពបានជោគជ័យ");
    showDeleteAvatarDialog.value = false;
  } catch (err) {
    toastStore.error(getErrorMessage(err, "មិនអាចលុបរូបភាពបានទេ"));
  } finally {
    isUpdatingAvatar.value = false;
  }
};

const handleDeleteAccount = async ({ password } = {}) => {
  if (isProtectedAdmin.value) return;

  if (!password) {
    toastStore.error("Please enter your password to delete your account.");
    return;
  }

  isDeletingAccount.value = true;
  try {
    await authStore.deleteAccount({ password });
    toastStore.success("លុបគណនីបានជោគជ័យ");
    authStore.logout();
    router.push("/login");
  } catch (err) {
    toastStore.error(getErrorMessage(err, "មិនអាចលុបគណនីបានទេ"));
  } finally {
    isDeletingAccount.value = false;
    showDeleteDialog.value = false;
  }
};

const triggerFileInput = () => fileInput.value?.click();

const personalInfo = computed(() => [
  { label: "ឈ្មោះពេញ", value: user.value?.fullName, icon: UserIcon },
  { label: "អ៊ីមែល", value: user.value?.email, icon: MailIcon },
  { label: "លេខទូរស័ព្ទ", value: user.value?.phoneNumber, icon: PhoneIcon },
  {
    label: "ភេទ",
    value:
      normalizeGender(user.value?.gender) === "MALE"
        ? "ប្រុស"
        : normalizeGender(user.value?.gender) === "FEMALE"
          ? "ស្រី"
          : user.value?.gender || "មិនមាន",
    icon: UserIcon,
  },
  {
    label: "ថ្ងៃខែឆ្នាំកំណើត",
    value: user.value?.birthday
      ? new Date(user.value.birthday).toLocaleDateString()
      : null,
    icon: CalendarIcon,
  },
  {
    label: "ថ្ងៃចូលធ្វើការ",
    value: user.value?.hireDate
      ? new Date(user.value.hireDate).toLocaleDateString()
      : null,
    icon: CalendarIcon,
  },
  !isAdminProfile.value && {
    label: "ប្រាក់បៀវត្សបច្ចុប្បន្ន",
    value: user.value?.salary ? `$${user.value.salary.toLocaleString()}` : null,
    icon: DollarSignIcon,
  },
  {
    label: "ស្ថានភាពគណនី",
    value: user.value?.status,
    icon: ShieldIcon,
    isBadge: true,
  },
].filter(Boolean));

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile-card,
.profile-info-card {
  position: relative;
  overflow: hidden;
  border-color: rgba(226, 232, 240, 0.88) !important;
  border-radius: 18px !important;
  background:
    radial-gradient(circle at 85% 0%, rgba(132, 169, 140, 0.14), transparent 34%),
    #ffffff;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.08) !important;
}

.profile-card::before,
.profile-info-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.65), transparent 42%);
}

.profile-card > *,
.profile-info-card > * {
  position: relative;
  z-index: 1;
}

.profile-avatar-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 156px;
}

.profile-avatar {
  position: relative;
  border: 5px solid #ffffff;
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.16),
    0 0 0 1px rgba(132, 169, 140, 0.2);
}

.avatar-action-btn,
.avatar-action-spacer {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  margin-top: 90px;
}

.avatar-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #475569;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background-color 0.25s ease,
    color 0.25s ease;
}

.avatar-action-btn:hover:not(:disabled) {
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.13);
  transform: translateY(-3px);
}

.avatar-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.avatar-action-btn--upload:hover:not(:disabled) {
  background: #ecfdf5;
  color: #059669;
}

.avatar-action-btn--delete {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #f97316;
}

.avatar-action-btn--delete:hover:not(:disabled) {
  background: #ffedd5;
  color: #ea580c;
}

.avatar-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(2px);
}

.avatar-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: avatarSpin 0.8s linear infinite;
}

.profile-action-btn {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 600;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background-color 0.25s ease;
}

.profile-action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.profile-action-btn--primary {
  background: #f7f8f7;
  border: 1px solid #52775d;
  color: #000000;
  /* box-shadow: 0 12px 22px rgba(45, 106, 79, 0.22); */
}

.profile-action-btn--primary:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(45, 106, 79, 0.26);
}

.profile-action-btn--indigo {
  border: 1px solid #dbe4ff;
  background: #eef2ff;
  color: #4f46e5;
}

.profile-action-btn--indigo:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(45, 106, 79, 0.24);
}

.profile-action-btn--emerald {
  border: 1px solid #bbf7d0;
  background: #ecfdf5;
  color: #059669;
}

.profile-action-btn--emerald:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(45, 106, 79, 0.24);
}

.profile-action-btn--danger {
  border: 1px solid #fee2e2;
  background: #fff7f7;
  color: #ef4444;
}

.profile-action-btn--danger:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(45, 106, 79, 0.24);
}

.profile-info-grid {
  align-items: stretch;
}

.profile-info-item {
  padding: 18px;
  border: 1px solid rgba(226, 232, 240, 0.82);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
  transition:
    border-color 0.25s ease,
    background-color 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.profile-info-item:hover {
  border-color: rgba(132, 169, 140, 0.42);
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.07);
  transform: translateY(-2px);
}

.profile-info-icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: #eef7f0;
  color: #52775d;
}

.profile-info-label {
  font-weight: 600;
}

:global(:root[data-theme="dark"]) .profile-card,
:global(:root[data-theme="dark"]) .profile-info-card {
  border-color: rgba(148, 163, 184, 0.18) !important;
  background:
    radial-gradient(circle at 85% 0%, rgba(94, 227, 154, 0.1), transparent 34%),
    #121f22;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34) !important;
}

:global(:root[data-theme="dark"]) .profile-card::before,
:global(:root[data-theme="dark"]) .profile-info-card::before {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 42%);
}

:global(:root[data-theme="dark"]) .profile-page :deep(.text-gray-900) {
  color: #f8fafc !important;
}

:global(:root[data-theme="dark"]) .profile-page :deep(.text-gray-500) {
  color: #94a3b8 !important;
}

:global(:root[data-theme="dark"]) .profile-card :deep(.text-gray-900),
:global(:root[data-theme="dark"]) .profile-info-card :deep(.text-gray-900) {
  color: #f8fafc !important;
}

:global(:root[data-theme="dark"]) .profile-card :deep(.text-gray-500),
:global(:root[data-theme="dark"]) .profile-info-card :deep(.text-gray-500) {
  color: #94a3b8 !important;
}

:global(:root[data-theme="dark"]) .profile-avatar {
  border-color: #18292c;
  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.36),
    0 0 0 1px rgba(94, 227, 154, 0.18);
}

:global(:root[data-theme="dark"]) .avatar-action-btn {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(16, 29, 33, 0.92);
  color: #cbd5e1;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
}

:global(:root[data-theme="dark"]) .avatar-action-btn--upload:hover:not(:disabled) {
  background: rgba(20, 83, 45, 0.38);
  color: #86efac;
}

:global(:root[data-theme="dark"]) .avatar-action-btn--delete {
  border-color: rgba(248, 113, 113, 0.24);
  background: rgba(127, 29, 29, 0.22);
  color: #fca5a5;
}

:global(:root[data-theme="dark"]) .avatar-action-btn--delete:hover:not(:disabled) {
  background: rgba(127, 29, 29, 0.34);
  color: #fecaca;
}

:global(:root[data-theme="dark"]) .profile-action-btn--primary {
  border-color: rgba(94, 227, 154, 0.28);
  background: rgba(94, 227, 154, 0.12);
  color: #d7fff0;
  box-shadow: none;
}

:global(:root[data-theme="dark"]) .profile-action-btn--primary:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.26);
}

:global(:root[data-theme="dark"]) .profile-action-btn--indigo {
  border-color: rgba(129, 140, 248, 0.24);
  background: rgba(49, 46, 129, 0.28);
  color: #c4b5fd;
}

:global(:root[data-theme="dark"]) .profile-action-btn--indigo:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.26);
}

:global(:root[data-theme="dark"]) .profile-action-btn--emerald {
  border-color: rgba(52, 211, 153, 0.22);
  background: rgba(6, 78, 59, 0.28);
  color: #6ee7b7;
}

:global(:root[data-theme="dark"]) .profile-action-btn--emerald:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.26);
}

:global(:root[data-theme="dark"]) .profile-action-btn--danger {
  border-color: rgba(248, 113, 113, 0.22);
  background: rgba(127, 29, 29, 0.22);
  color: #fca5a5;
}

:global(:root[data-theme="dark"]) .profile-action-btn--danger:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.26);
}

:global(:root[data-theme="dark"]) .profile-info-item {
  border-color: rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.22);
}

:global(:root[data-theme="dark"]) .profile-info-item:hover {
  border-color: rgba(94, 227, 154, 0.26);
  background: rgba(15, 23, 42, 0.36);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
}

:global(:root[data-theme="dark"]) .profile-info-icon {
  background: rgba(94, 227, 154, 0.1);
  color: #9ff0c0;
}

@keyframes avatarSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .avatar-spinner {
    animation: none;
  }

  .avatar-action-btn,
  .profile-action-btn,
  .profile-info-item {
    transition: none;
  }
}

@media (max-width: 575.98px) {
  .profile-card,
  .profile-info-card {
    padding: 1.25rem !important;
  }

  .profile-avatar-stage {
    gap: 10px;
  }
}
</style>
