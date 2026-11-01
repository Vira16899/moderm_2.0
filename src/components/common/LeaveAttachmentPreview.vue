<script setup>
import { computed, ref, watch } from 'vue';
import { ArrowUpRight, Expand, Paperclip } from 'lucide-vue-next';
import BaseModal from '../base/BaseModal.vue';
const props = defineProps({ url: { type: String, required: true } });
const open = ref(false), failed = ref(false);
const isImage = computed(() => /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif|tiff?)(?:[?#]|$)/i.test(props.url));
watch(() => props.url, () => { failed.value = false; open.value = false; });
</script>
<template>
  <section class="attachment-preview" aria-label="ឯកសារ">
    <h3>ឯកសារ</h3>
    <button v-if="isImage && !failed" type="button" class="attachment-thumbnail" aria-label="ពង្រីករូបភាពភ្ជាប់" @click="open = true">
      <img :src="url" alt="រូបភាពភ្ជាប់នឹងសំណើសុំច្បាប់" loading="lazy" @error="failed = true" />
      <span><Expand :size="16" />ពង្រីករូបភាព</span>
    </button>
    <a class="attachment-open" :href="url" target="_blank" rel="noopener noreferrer"><Paperclip :size="18" /><span>មើលឯកសារភ្ជាប់</span><ArrowUpRight :size="17" /></a>
    <BaseModal v-model="open" title="រូបភាពភ្ជាប់" show-header size="xl"><img class="attachment-full" :src="url" alt="រូបភាពភ្ជាប់នឹងសំណើសុំច្បាប់" /><a class="attachment-open" :href="url" target="_blank" rel="noopener noreferrer">បើកក្នុងផ្ទាំងថ្មី<ArrowUpRight :size="17" /></a></BaseModal>
  </section>
</template>
<style scoped>
.attachment-preview { margin:22px 0; }
.attachment-preview h3 { margin:0 0 10px; color:var(--muted); font-size:13px; font-weight:500; }
.attachment-thumbnail { position:relative; display:block; width:100%; height:160px; overflow:hidden; border:1px solid var(--line); border-radius:12px; background:var(--soft); cursor:zoom-in; }
.attachment-thumbnail img { width:100%; height:100%; object-fit:contain; }
.attachment-thumbnail>span { position:absolute; bottom:8px; right:8px; display:flex; align-items:center; gap:6px; padding:6px 9px; border-radius:8px; background:var(--surface,#fff); color:var(--ink); font-size:12px; }
.attachment-open { display:flex; align-items:center; gap:10px; padding:13px 14px; margin-top:8px; border:1px solid var(--line); border-radius:11px; color:var(--blue); font-size:13px; transition:background .15s; }
.attachment-open span { flex:1; }
.attachment-open:hover { background:var(--soft); }
.attachment-thumbnail:focus-visible,.attachment-open:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
.attachment-full { display:block; max-width:100%; max-height:65dvh; margin:auto; object-fit:contain; }
</style>
