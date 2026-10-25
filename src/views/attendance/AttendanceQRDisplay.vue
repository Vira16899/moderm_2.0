<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import QrcodeVue from "qrcode.vue";
import { useAttendanceStore } from "@/stores/attendanceStore";

const attendanceStore = useAttendanceStore();
let refreshTimer;

const activeSessions = computed(() =>
  attendanceStore.sessions.filter(
    (session) => Number(session.is_active) === 1 && session.qr_token
  )
);

const sessionLabels = {
  MORNING_CHECK_IN: "ចូលធ្វើការពេលព្រឹក",
  MORNING_CHECK_OUT: "ចេញពីការងារពេលព្រឹក",
  AFTERNOON_CHECK_IN: "ចូលធ្វើការពេលរសៀល",
  AFTERNOON_CHECK_OUT: "ចេញពីការងារពេលរសៀល",
};

function sessionLabel(type) {
  return sessionLabels[type] || type?.replaceAll("_", " ") || "Attendance";
}

async function loadQr() {
  await attendanceStore.fetchQrDisplay();
}

onMounted(() => {
  loadQr();
  refreshTimer = window.setInterval(loadQr, 30_000);
});

onUnmounted(() => window.clearInterval(refreshTimer));
</script>

<template>
  <main class="tv-page">
    <header class="tv-header">
      <p class="eyebrow">GARMORA · ប្រព័ន្ធវត្តមានបុគ្គលិក</p>
      <h1>ស្កេនដើម្បីកត់ត្រាវត្តមាន</h1>
      <p class="subtitle">សូមប្រើទូរស័ព្ទរបស់អ្នកស្កេន QR Code តាមវេនរបស់អ្នក។</p>
    </header>

    <section v-if="attendanceStore.loading && !attendanceStore.sessions.length" class="message" aria-live="polite">
      កំពុងផ្ទុក QR Code វត្តមាន…
    </section>

    <section v-else-if="attendanceStore.error" class="message error" role="alert">
      {{ attendanceStore.error }}
    </section>

    <section v-else-if="activeSessions.length" class="qr-grid" aria-label="Active attendance QR codes">
      <article v-for="session in activeSessions" :key="session.id" class="qr-card">
        <h2>{{ sessionLabel(session.session_type) }}</h2>
        <div class="qr-frame">
          <QrcodeVue :value="session.qr_token" :size="280" level="H" render-as="svg" />
        </div>
        <p class="scan-hint">សូមស្កេន QR Code នេះដើម្បីកត់ត្រាវត្តមាន</p>
        <p class="time">{{ session.available_from }} – {{ session.available_until }}</p>
      </article>
    </section>

    <section v-else class="message">
      <h2>មិនមានវេនវត្តមានសកម្មទេ</h2>
      <p>QR Code វត្តមាននឹងបង្ហាញនៅទីនេះ នៅពេលមានវេនសកម្ម។</p>
    </section>
  </main>
</template>

<style scoped>
.tv-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: clamp(24px, 4vw, 56px);
  color: #10243a;
  background: radial-gradient(ellipse at 8% 0%, #d4f6ff 0, transparent 45%),
    linear-gradient(125deg, #f1fbff, #e7f8fb 60%, #f7fcff);
  font-family: var(--bs-body-font-family, "Poppins", "Kantumruy Pro", sans-serif);
}

.tv-header { margin: 0 auto 36px; text-align: center; }
.eyebrow { margin: 0 0 10px; color: #087f8c; font-size: 14px; font-weight: 800; letter-spacing: .16em; }
.tv-header h1 { margin: 0; font-size: clamp(30px, 4vw, 48px); font-weight: 800; }
.subtitle { margin: 12px 0 0; color: #567080; font-size: clamp(16px, 2vw, 20px); }
.qr-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; }
.qr-card { width: min(100%, 380px); box-sizing: border-box; padding: 28px; border: 1px solid #e4eef2; border-radius: 24px; background: #fff; text-align: center; box-shadow: 0 16px 40px #18394c18; }
.qr-card h2 { margin: 0 0 20px; font-size: 24px; text-transform: capitalize; }
.qr-frame { display: inline-flex; padding: 14px; border-radius: 16px; background: white; box-shadow: 0 3px 18px #17344c14; }
.qr-frame :deep(svg) { display: block; max-width: 100%; height: auto; }
.scan-hint { margin: 20px 0 6px; font-size: 17px; font-weight: 700; }
.time { margin: 0; color: #627785; font-size: 15px; }
.message { margin: 12vh auto 0; max-width: 680px; text-align: center; color: #526a78; font-size: 20px; }
.message h2 { color: #10243a; }
.error { color: #b42318; }

@media (max-width: 480px) {
  .tv-page { padding: 24px 16px; }
  .qr-card { padding: 20px 14px; }
}
</style>
