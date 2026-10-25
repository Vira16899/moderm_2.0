import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi, profileApi } from "@/api/api";
import {
  createSuspendedAccountError,
  isAccountInactive,
  isSuspendedAccountError,
  normalizeAccountStatus,
} from "@/utils/accountStatus";

const ROLE_BY_ID = {
  1: "ADMIN",
  2: "MANAGER",
  3: "STAFF",
};

const normalizeRole = (role) => {
  if (!role) return null;

  if (typeof role === "object") {
    return normalizeRole(
      role.name || role.role || role.code || role.value || role.id,
    );
  }

  const roleText = String(role).trim().toUpperCase();

  return ROLE_BY_ID[Number(roleText)] || roleText;
};

const normalizeUser = (userData) => {
  if (!userData) return null;

  const fullName =
    userData.fullname ||
    userData.full_name ||
    userData.fullName ||
    userData.name ||
    userData.username ||
    userData.displayName ||
    userData.display_name ||
    [
      userData.firstName || userData.first_name,
      userData.lastName || userData.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "";
  const phoneNumber =
    userData.phone ||
    userData.phone_number ||
    userData.phoneNumber ||
    userData.mobile ||
    userData.mobileNumber ||
    "";

  return {
    ...userData,
    fullName,
    phoneNumber,
    status: normalizeAccountStatus(
      userData.status ||
        userData.accountStatus ||
        userData.account_status ||
        userData.state,
    ),
    role: normalizeRole(
      userData.role ||
        userData.userRole ||
        userData.type ||
        userData.roleId ||
        userData.role_id,
    ),
  };
};

const normalizeChangePasswordPayload = (data = {}) => {
  const currentPassword =
    data.currentPassword ??
    data.current_password ??
    data.oldPassword ??
    data.old_password;
  const newPassword = data.newPassword ?? data.password ?? data.new_password;

  return {
    currentPassword,
    newPassword,
  };
};

export const useAuthStore = defineStore("auth", () => {
  const token = ref(sessionStorage.getItem("auth-token") || null);
  const user = ref(
    normalizeUser(JSON.parse(sessionStorage.getItem("auth-user")) || null),
  );
  const isAuthenticated = computed(() => !!token.value);

  const getLoginPayload = (response) => {
    const responseData = response.data?.data || response.data;
    const userWrapper =
      responseData.userData || responseData.user || responseData.profile;

    return {
      token:
        responseData.token ||
        responseData.accessToken ||
        responseData.access_token ||
        responseData.jwt,
      user: userWrapper?.user || userWrapper,
    };
  };

  async function login(credentials) {
    const response = await authApi.login(credentials);
    const { token: newToken, user: userData } = getLoginPayload(response);

    if (!newToken || !userData) {
      throw new Error("Invalid login response");
    }

    const normalizedUser = normalizeUser(userData);
    if (isAccountInactive(normalizedUser)) {
      throw createSuspendedAccountError();
    }

    token.value = newToken;
    user.value = normalizedUser;
    sessionStorage.setItem("auth-token", newToken);
    sessionStorage.setItem("auth-user", JSON.stringify(normalizedUser));
    return normalizedUser;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    sessionStorage.removeItem("auth-token");
    sessionStorage.removeItem("auth-user");
  }

  async function forgotPassword(email) {
    return await authApi.forgotPassword({ email });
  }

  async function resetPassword(data) {
    return await authApi.resetPassword(data);
  }

  async function changePassword(data) {
    return await authApi.changePassword(normalizeChangePasswordPayload(data));
  }

  async function changeEmail(data) {
    return await authApi.changeEmail(data);
  }

  async function verifyEmailChange(data) {
    return await authApi.verifyEmailChange(data);
  }

  async function deleteAccount(data) {
    return await authApi.deleteAccount(data);
  }

  async function fetchProfile() {
    try {
      const response = await profileApi.getProfile();
      const responseData = response.data?.data || response.data;
      const profile = responseData.user || responseData.profile || responseData;
      updateUser(profile);
      return user.value;
    } catch (error) {
      if (isSuspendedAccountError(error)) {
        clearSession();
        throw createSuspendedAccountError();
      }

      throw error;
    }
  }

  async function updateProfile(data) {
    const response = await profileApi.updateProfile(data);
    const responseData = response.data?.data || response.data;
    const profile = responseData.user || responseData.profile || responseData;
    updateUser(profile);
    return user.value;
  }

  async function uploadAvatar(file) {
    const response = await profileApi.uploadAvatar(file);
    const responseData = response.data?.data || response.data;
    const profile = responseData.user || responseData.profile || responseData;
    updateUser(profile);
    return user.value;
  }

  async function deleteAvatar() {
    const response = await profileApi.deleteAvatar();
    const responseData = response.data?.data || response.data;
    const profile = responseData.user || responseData.profile || responseData;
    updateUser(profile);
    return user.value;
  }

  function updateUser(userData) {
    const normalizedUser = normalizeUser(
      user.value ? { ...user.value, ...userData } : userData,
    );

    if (isAccountInactive(normalizedUser)) {
      clearSession();
      throw createSuspendedAccountError();
    }

    if (user.value) {
      user.value = normalizedUser;
      sessionStorage.setItem("auth-user", JSON.stringify(user.value));
    } else {
      user.value = normalizedUser;
      sessionStorage.setItem("auth-user", JSON.stringify(user.value));
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    clearSession,
    updateUser,
    forgotPassword,
    resetPassword,
    changePassword,
    changeEmail,
    verifyEmailChange,
    deleteAccount,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
  };
});
