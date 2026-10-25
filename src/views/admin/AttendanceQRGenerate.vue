<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";

import { useAttendanceStore } from "@/stores/attendanceStore";

const attendanceStore = useAttendanceStore();

const attendanceDate = ref(
  new Date().toISOString().split("T")[0]
);

const generating = ref(false);

const generateQR = async () => {
  try {
    generating.value = true;

    await attendanceStore.generateSessions(
      attendanceDate.value
    );

    await Swal.fire({
      icon: "success",
      title: "Success",
      text: "Attendance sessions generated successfully.",
    });
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "Failed",
      text:
        error.message ||
        "Unable to generate attendance sessions.",
    });
  } finally {
    generating.value = false;
  }
};
</script>

<template>
  <section class="attendance-generate">
    <h1>Generate Attendance Sessions</h1>

    <div class="form-group">
      <label for="attendanceDate">
        Attendance Date
      </label>

      <input
        id="attendanceDate"
        v-model="attendanceDate"
        type="date"
      />
    </div>

    <button
      type="button"
      :disabled="generating"
      @click="generateQR"
    >
      {{
        generating
          ? "Generating..."
          : "Generate Attendance QR"
      }}
    </button>
  </section>
</template>