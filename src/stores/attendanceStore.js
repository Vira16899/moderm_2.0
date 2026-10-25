import { defineStore } from "pinia";
import { ref } from "vue";

import {
  generateAttendanceSessions,
  getAttendanceQrDisplay,
} from "@/api/attendanceApi";

export const useAttendanceStore = defineStore(
  "attendance",
  () => {
    const sessions = ref([]);
    const loading = ref(false);
    const error = ref("");

    // Admin: Generate attendance sessions
    const generateSessions = async (attendanceDate) => {
      try {
        loading.value = true;
        error.value = "";

        const data = await generateAttendanceSessions(
          attendanceDate
        );

        return data;
      } catch (err) {
        error.value =
          err.message ||
          "Unable to generate attendance sessions.";

        throw err;
      } finally {
        loading.value = false;
      }
    };

    // Factory TV: Get currently active QR
    const fetchQrDisplay = async () => {
      try {
        loading.value = true;
        error.value = "";

        const data = await getAttendanceQrDisplay();

        sessions.value = data || [];
      } catch (err) {
        error.value =
          err.message ||
          "Unable to load attendance QR.";
      } finally {
        loading.value = false;
      }
    };

    const clearSessions = () => {
      sessions.value = [];
    };

    return {
      sessions,
      loading,
      error,
      generateSessions,
      fetchQrDisplay,
      clearSessions,
    };
  }
);