import { defineStore } from "pinia";
import api from "@/api/api";
import { computed, ref } from "vue";
import { useRouter } from 'vue-router';

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

export const useAuthStore = defineStore('auth', () => {

  // State Management
  const token = ref(sessionStorage.getItem('token'));
  const message_error = ref('');
  const profile = ref(null);
  const router = useRouter();

  const isLogined = computed(() => {
    return !!token.value;
  });

  // Safe Token Setter to keep sessionStorage and State synchronized
  const setToken = (newToken) => {
    token.value = newToken;
    if (newToken) {
      sessionStorage.setItem('token', newToken);
    } else {
      sessionStorage.removeItem('token');
    }
  };

  // Actions 
  const login = async (data) => {
    try {
      message_error.value = '';
      const res = await api.post('auth/login', data);
      
      // Target the exact data format your backend uses
      const userToken = res.data?.data?.token || res.data?.token;
      setToken(userToken);
      
      await fetchProfile(); 
    } catch (error) {    
      message_error.value = error.response?.data?.message || 'Login failed';
      throw error; 
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await api.get('auth/profile');
      // Direct assignment fallback depending on how your backend nests objects
      profile.value = res.data?.data || res.data;
    } catch (error) {
      // If the profile endpoint explicitly returns a 401 because the server token died,
      // we clear storage so the client state matches the server state.
      if (error.response?.status === 401) {
        logoutLocal();
      }
      throw error;
    }
  }

  // Local logout logic (clearing state without necessarily calling the API)
  const logoutLocal = () => {
    sessionStorage.removeItem('token');
    token.value = null;
    profile.value = null;
  };

  const logout = async () => {
    try {
      await api.delete('auth/logout');
    } catch (error) {
      console.error("Logout error:", error.response);
    } finally {
      logoutLocal();
    }
  }

  const forgotPassword = async (email) => {
    try {
      return await api.post('auth/forget-password', { email });
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  const resetPassword = async (tokenValue, newPassword) => {
    try {
      const res = await api.post('auth/reset-password', { 
        token: tokenValue, 
        newPassword: newPassword 
      });
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  const changePassword = async (payload) => {
    try {
      return await api.put('auth/change-password', normalizeChangePasswordPayload(payload));
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  return {
    token,
    isLogined,
    message_error,
    profile,
    login,
    fetchProfile,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    logoutLocal,
    setToken // Exported so components can access it safely
  }
});
