<script
  setup>  import QrcodeVue from "qrcode.vue"; defineProps({ session: { type: Object, required: true, }, }); const sessionLabels = { MORNING_CHECK_IN: "Morning Check In", MORNING_CHECK_OUT: "Morning Check Out", AFTERNOON_CHECK_IN: "Afternoon Check In", AFTERNOON_CHECK_OUT: "Afternoon Check Out", }; function getSessionLabel(type) { return sessionLabels[type] || type; } </script>
<template>
  <div class="qr-card"> <!-- Factory Name -->
    <div class="factory-name"> GARMORA </div> <!-- Attendance -->
    <div class="attendance-title"> ATTENDANCE </div> <!-- Session -->
    <h2 class="session-title"> {{ getSessionLabel(session.session_type) }} </h2> <!-- QR Code -->
    <div class="qr-wrapper">
      <QrcodeVue :value="session.qr_token" :size="260" level="H" render-as="svg" />
    </div> <!-- Message -->
    <p class="scan-text"> Scan this QR code to record your attendance </p> <!-- Time -->
    <div class="session-time"> {{ session.available_from }} - {{ session.available_until }} </div>
  </div>
</template>
<style scoped>
.qr-card {
  width: 420px;
  min-height: 520px;
  background: white;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.factory-name {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 3px;
}

.attendance-title {
  margin-top: 5px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
}

.session-title {
  margin: 20px 0;
  font-size: 25px;
  font-weight: 700;
}

.qr-wrapper {
  padding: 10px;
  background: white;
  border-radius: 12px;
}

.scan-text {
  margin-top: 20px;
  font-size: 16px;
  font-weight: 500;
}

.session-time {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}
</style>
