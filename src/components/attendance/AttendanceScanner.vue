<script setup>
import { ref } from "vue";
import { QrcodeStream } from "vue-qrcode-reader";

const emit = defineEmits(["scanned", "close"]);

const errorMessage = ref("");
const isScanning = ref(true);

const onDetect = (detectedCodes) => {
  if (!detectedCodes?.length || !isScanning.value) {
    return;
  }

  const value = detectedCodes[0]?.rawValue;

  if (!value) {
    return;
  }

  isScanning.value = false;

  emit("scanned", value);
};

const onError = (error) => {
  console.error("QR Scanner Error:", error);

  if (error.name === "NotAllowedError") {
    errorMessage.value =
      "សូមអនុញ្ញាតឱ្យ Website ប្រើ Camera។";
  } else if (error.name === "NotFoundError") {
    errorMessage.value =
      "រកមិនឃើញ Camera នៅលើឧបករណ៍នេះទេ។";
  } else if (error.name === "NotReadableError") {
    errorMessage.value =
      "Camera កំពុងត្រូវបានប្រើដោយកម្មវិធីផ្សេង។";
  } else {
    errorMessage.value =
      "មិនអាចបើក Camera បានទេ។";
  }
};
</script>

<template>
  <div class="scanner-overlay">
    <div class="scanner-modal">

      <!-- Header -->
      <div class="scanner-header">
        <div>
          <h2>Scan Attendance QR</h2>
          <p>
            សូមស្កេន QR Code ដែលបង្ហាញនៅ Factory TV
          </p>
        </div>

        <button
          type="button"
          class="close-button"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Camera -->
      <div class="scanner-container">

        <QrcodeStream
          v-if="isScanning"
          @detect="onDetect"
          @error="onError"
        />

        <!-- Scanner frame -->
        <div class="scanner-frame">
          <span class="corner top-left"></span>
          <span class="corner top-right"></span>
          <span class="corner bottom-left"></span>
          <span class="corner bottom-right"></span>
        </div>

      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="error-message"
      >
        {{ errorMessage }}
      </div>

      <!-- Instruction -->
      <p class="scanner-instruction">
        ដាក់ QR Code ឱ្យនៅក្នុងប្រអប់
      </p>

      <!-- Close -->
      <button
        type="button"
        class="cancel-button"
        @click="emit('close')"
      >
        បោះបង់
      </button>

    </div>
  </div>
</template>

<style scoped>
.scanner-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  background: rgba(0, 0, 0, 0.75);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;
}

.scanner-modal {
  width: 100%;
  max-width: 520px;

  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 20px;

  padding: 24px;

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  margin-bottom: 20px;
}

.scanner-header h2 {
  margin: 0;

  font-size: 24px;
  font-weight: 700;
}

.scanner-header p {
  margin: 6px 0 0;

  color: var(--muted);
  font-size: 14px;
}

.close-button {
  width: 36px;
  height: 36px;

  border: none;
  border-radius: 50%;

  background: var(--soft);
  color: var(--ink);

  cursor: pointer;

  font-size: 18px;
}

.scanner-container {
  position: relative;

  width: 100%;
  aspect-ratio: 1 / 1;

  overflow: hidden;

  border-radius: 16px;

  background: black;
}

.scanner-container :deep(video) {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.scanner-frame {
  position: absolute;

  width: 65%;
  height: 65%;

  left: 17.5%;
  top: 17.5%;

  pointer-events: none;
}

.corner {
  position: absolute;

  width: 35px;
  height: 35px;

  border-color: white;
  border-style: solid;
}

.top-left {
  top: 0;
  left: 0;

  border-width: 4px 0 0 4px;
}

.top-right {
  top: 0;
  right: 0;

  border-width: 4px 4px 0 0;
}

.bottom-left {
  bottom: 0;
  left: 0;

  border-width: 0 0 4px 4px;
}

.bottom-right {
  bottom: 0;
  right: 0;

  border-width: 0 4px 4px 0;
}

.scanner-instruction {
  text-align: center;

  margin: 16px 0;

  color: var(--muted);

  font-size: 15px;
}

.error-message {
  margin-top: 12px;

  padding: 12px;

  border-radius: 10px;

  background: #fff0f2;
  color: #a62d42;

  text-align: center;

  font-size: 14px;
}

.cancel-button {
  width: 100%;

  padding: 12px;

  border: none;
  border-radius: 10px;

  background: var(--soft);

  color: var(--ink);

  font-size: 15px;
  font-weight: 600;

  cursor: pointer;
}

.cancel-button:hover {
  background: var(--line);
}

.dark .scanner-overlay {
  background: rgba(2, 10, 18, 0.84);
}

.dark .error-message {
  background: #3e272d;
  color: #ffabb8;
}
</style>