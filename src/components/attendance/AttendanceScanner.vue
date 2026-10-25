<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { QrCode, X, CameraOff, LoaderCircle } from 'lucide-vue-next';
import BaseModal from '../base/BaseModal.vue';
import BaseButton from '../base/BaseButton.vue';
const emit = defineEmits(['scanned','close']);
const cameraError = ref(''), cameraReady = ref(false), accepted = ref(false);
let closed = false;
onBeforeUnmount(() => { closed = true; });
function close() { closed = true; accepted.value = true; emit('close'); }
function onDetect(codes) {
  if (closed || accepted.value || !Array.isArray(codes)) return;
  const code = codes.find(item => typeof item.rawValue === 'string' && item.rawValue.trim());
  if (code) { accepted.value = true; emit('scanned', code.rawValue); }
}
function onCameraError(cause) {
  if (closed) return;
  cameraReady.value = false;
  cameraError.value = ({
    NotAllowedError:'សូមអនុញ្ញាតឱ្យប្រើកាមេរ៉ាក្នុងការកំណត់របស់កម្មវិធីរុករក រួចបើកម៉ាស៊ីនស្កេនម្ដងទៀត។',
    NotFoundError:'រកមិនឃើញកាមេរ៉ាទេ។ សូមភ្ជាប់កាមេរ៉ា ឬប្រើឧបករណ៍ដែលមានកាមេរ៉ា។',
    NotReadableError:'កាមេរ៉ាកំពុងត្រូវបានប្រើដោយកម្មវិធីផ្សេង។ សូមបិទកម្មវិធីនោះ រួចព្យាយាមម្ដងទៀត។',
    OverconstrainedError:'កាមេរ៉ានេះមិនអាចប្រើបានទេ។ សូមសាកល្បងកាមេរ៉ាផ្សេង។',
  })[cause?.name] || 'មិនអាចបើកកាមេរ៉ាបានទេ។ សូមពិនិត្យកាមេរ៉ា និងការអនុញ្ញាត រួចព្យាយាមម្ដងទៀត។';
}
</script>

<template>
  <BaseModal model-value title="ស្កេន QR កត់ត្រាវត្តមាន" size="sm" class="attendance-scanner-modal" @update:model-value="open => { if (!open) close(); }">
    <div class="scanner-content"><header class="scanner-header"><span class="scanner-heading-icon"><QrCode :size="21" /></span><div><h2>ស្កេន QR វត្តមាន</h2><p>ស្កេន QR ដោយប្រើកាមេរ៉ារបស់អ្នក</p></div><button type="button" class="scanner-close" aria-label="បិទម៉ាស៊ីនស្កេន" @click="close"><X :size="19" /></button></header>
      <div class="scanner-camera"><QrcodeStream v-if="!accepted && !cameraError" :formats="['qr_code']" @detect="onDetect" @error="onCameraError" @camera-on="cameraReady = true" /><div v-if="!cameraReady && !cameraError && !accepted" class="scanner-camera-loading" role="status"><LoaderCircle :size="24" class="scanner-spinning" /><span>កំពុងបើកកាមេរ៉ា…</span></div><div v-if="cameraError" class="scanner-camera-unavailable"><CameraOff :size="32" /><span>កាមេរ៉ាមិនអាចប្រើបាន</span></div><div v-if="!cameraError && !accepted" class="scanner-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>
      <p v-if="cameraError" class="scanner-error" role="alert">{{ cameraError }}</p><p v-else class="scanner-hint">ដាក់ QR នៅកណ្ដាលប្រអប់ ដើម្បីស្កេន។</p>
      <footer class="scanner-footer"><BaseButton variant="outline" @click="close">បោះបង់</BaseButton></footer>
    </div>
  </BaseModal>
</template>

<style scoped>
:global(dialog.attendance-scanner-modal) { --scanner-accent:#008c9b; --scanner-soft:#eaf6f7; width:calc(100% - 24px); max-width:420px !important; padding:20px; max-height:calc(100dvh - 24px); }
.scanner-content { display:grid; gap:16px; }
.scanner-header { display:flex; align-items:flex-start; gap:10px; }
.scanner-heading-icon { width:38px; height:38px; flex-shrink:0; display:grid; place-items:center; background:var(--scanner-soft); color:var(--scanner-accent); border-radius:11px; }
.scanner-header>div { flex:1; min-width:0; } .scanner-header h2 { margin:0; font-size:17px; font-weight:650; line-height:1.6; }
.scanner-header p { margin-top:4px; font-size:11px; color:var(--muted); line-height:1.8; }
.scanner-close { display:grid; place-items:center; width:36px; height:36px; flex-shrink:0; background:var(--scanner-soft); color:var(--muted); border-radius:10px; cursor:pointer; }
.scanner-close:hover { color:var(--scanner-accent); background:var(--scanner-soft); }
.scanner-camera { position:relative; height:clamp(160px,32dvh,250px); width:100%; overflow:hidden; border-radius:14px; background:#101b25; }
.scanner-camera :deep(video) { width:100%; height:100%; object-fit:cover; }
.scanner-camera-loading,.scanner-camera-unavailable { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:12px; color:#dce8ee; font-size:12px; }
.scanner-frame { position:absolute; top:16%; left:25%; width:50%; height:68%; pointer-events:none; }
.scanner-frame i { position:absolute; width:24px; height:24px; border-style:solid; border-color:white; }
.scanner-frame i:nth-child(1) { top:0; left:0; border-width:3px 0 0 3px; } .scanner-frame i:nth-child(2) { top:0; right:0; border-width:3px 3px 0 0; } .scanner-frame i:nth-child(3) { bottom:0; left:0; border-width:0 0 3px 3px; } .scanner-frame i:nth-child(4) { bottom:0; right:0; border-width:0 3px 3px 0; }
.scanner-hint { text-align:center; font-size:11px; color:var(--muted); line-height:1.8; }
.scanner-error { padding:10px 12px; border-radius:10px; background:#fff0f2; color:#a53b50; font-size:12px; line-height:1.8; overflow-wrap:anywhere; }
.scanner-footer { display:flex; justify-content:flex-end; padding-top:12px; border-top:1px solid var(--line); }
button:focus-visible { outline:2px solid var(--scanner-accent); outline-offset:3px; }
.scanner-spinning { animation:scanner-spin 1s linear infinite; } @keyframes scanner-spin { to { transform:rotate(360deg); } }
:global(.dark dialog.attendance-scanner-modal) { --scanner-accent:#62d3dc; --scanner-soft:#18383f; }
:global(.dark) .scanner-error { color:#f5a5b5; background:#422630; }
@media(max-height:600px) { :global(dialog.attendance-scanner-modal) { padding:16px; } .scanner-content { gap:12px; } }
@media(prefers-reduced-motion:reduce) { .scanner-spinning { animation:none; } }
</style>
