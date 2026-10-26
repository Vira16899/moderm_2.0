<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { CameraOff, LoaderCircle } from 'lucide-vue-next';
import BaseModal from '../base/BaseModal.vue';
import BaseButton from '../base/BaseButton.vue';
const props = defineProps({ submitting: Boolean });
watch(() => props.submitting, (busy, previous) => { if (previous && !busy && !closed) { accepted.value = false; cameraReady.value = false; } });
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
  <BaseModal model-value title="ស្កេន QR កត់ត្រាវត្តមាន" class="attendance-scanner-modal" @update:model-value="open => { if (!open) close(); }">
    <div class="scanner-content">
      <QrcodeStream v-if="!accepted && !cameraError" :formats="['qr_code']" @detect="onDetect" @error="onCameraError" @camera-on="cameraReady = true" />
      <div v-if="submitting || accepted || (!cameraReady && !cameraError)" class="scanner-status" role="status" aria-live="polite"><LoaderCircle :size="32" class="scanner-spinning" /><span>{{ submitting || accepted ? 'កំពុងកត់ត្រាវត្តមាន…' : 'កំពុងបើកកាមេរ៉ា…' }}</span></div>
      <div v-else-if="cameraError" class="scanner-status" role="alert"><CameraOff :size="36" /><p>{{ cameraError }}</p></div>
      <div v-if="cameraReady && !cameraError && !accepted" class="scanner-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <footer class="scanner-controls"><p v-if="!submitting && !cameraError">ដាក់ QR នៅកណ្ដាលប្រអប់ ដើម្បីស្កេន។</p><BaseButton variant="outline" class="scanner-cancel" @click="close">បោះបង់</BaseButton></footer>
    </div>
  </BaseModal>
</template>

<style scoped>
:global(dialog.attendance-scanner-modal) { position:fixed; margin:auto; width:calc(100vw - 32px); height:min(680px,calc(100dvh - 40px)); max-width:680px !important; max-height:calc(100dvh - 40px) !important; padding:0 !important; border:1px solid var(--line) !important; border-radius:20px !important; background:#0b151d !important; color:#fff; box-shadow:none; }
.scanner-content { position:relative; width:100%; height:100%; background:#0b151d; overflow:hidden; }
.scanner-content :deep(video) { width:100%; height:100%; object-fit:cover; }
.scanner-content :deep(.qrcode-stream-wrapper) { width:100%; height:100%; }
.scanner-status { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:18px; padding:28px 24px 140px; color:#eef8fa; background:#0b151d; font-size:15px; text-align:center; }
.scanner-status p { max-width:520px; line-height:1.9; }
.scanner-status>svg { color:#74d9df; }
.scanner-frame { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:min(65vw,340px,55dvh); aspect-ratio:1; pointer-events:none; }
.scanner-frame i { position:absolute; width:30px; height:30px; border-style:solid; border-color:#fff; filter:drop-shadow(0 1px 3px #0008); }
.scanner-frame i:nth-child(1) { top:0; left:0; border-width:3px 0 0 3px; } .scanner-frame i:nth-child(2) { top:0; right:0; border-width:3px 3px 0 0; } .scanner-frame i:nth-child(3) { bottom:0; left:0; border-width:0 0 3px 3px; } .scanner-frame i:nth-child(4) { bottom:0; right:0; border-width:0 3px 3px 0; }
.scanner-controls { position:absolute; bottom:0; left:0; right:0; display:flex; flex-direction:column; align-items:center; gap:18px; padding:36px 24px max(28px,env(safe-area-inset-bottom)); background:linear-gradient(transparent,#000b); color:#fff; text-align:center; }
.scanner-controls p { font-size:13px; }
.scanner-controls :deep(button.scanner-cancel) { min-width:150px; min-height:48px; color:#fff !important; background:#ffffff18 !important; border-color:#ffffff80 !important; backdrop-filter:blur(8px); }
.scanner-controls :deep(button.scanner-cancel:hover) { background:#ffffff30 !important; }
.scanner-spinning { animation:scanner-spin 1s linear infinite; } @keyframes scanner-spin { to { transform:rotate(360deg); } }
@media(prefers-reduced-motion:reduce) { .scanner-spinning { animation:none; } }
</style>