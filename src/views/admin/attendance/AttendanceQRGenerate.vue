
<script setup>
import { onMounted } from "vue";
import AttendanceQRCode from "@/components/attendance/AttendanceQRCode.vue";
import { useAttendanceStore } from "@/stores/attendanceStore";

const attendanceStore = useAttendanceStore();

onMounted(async () => {
  await attendanceStore.fetchQrDisplay();
});
</script>

<template>
    <div class="tv-page"> <!-- Header -->
        <header class="tv-header">
            <h1>FACTORA</h1>
            <p>Employee Attendance System</p>
        </header> <!-- Loading -->
        <div v-if="attendanceStore.loading" class="loading"> Loading attendance QR... </div> <!-- Error -->
        <div v-else-if="attendanceStore.error" class="error"> {{ attendanceStore.error }} </div> <!-- QR -->
        <div v-else class="qr-grid">
            <AttendanceQRCode v-for="session in attendanceStore.sessions" :key="session.id" :session="session" />
        </div>
    </div>
</template>
<style
    scoped>
    .tv-page {
        min-height: 100vh;
        padding: 30px;
        background: #f5f7f6;
    }

    .tv-header {
        text-align: center;
        margin-bottom: 30px;
    }

    .tv-header h1 {
        margin: 0;
        font-size: 42px;
        font-weight: 800;
        letter-spacing: 4px;
    }

    .tv-header p {
        margin-top: 5px;
        font-size: 18px;
        color: #666;
    }

    .qr-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
        max-width: 1000px;
        margin: auto;
    }

    .loading,
    .error {
        text-align: center;
        font-size: 20px;
        margin-top: 100px;
    }

    .error {
        color: #d33;
    }

    @media (max-width: 900px) {
        .qr-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
