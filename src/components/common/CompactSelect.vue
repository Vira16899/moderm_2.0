<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, useId, watch } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';
const props = defineProps({ modelValue: String, options: { type:Array, default:() => [] }, placeholder:String, disabled:Boolean, id:String });
const emit = defineEmits(['update:modelValue']);
const root=ref(null), trigger=ref(null), list=ref(null), open=ref(false), active=ref(0);
const listId=useId();
const selected=computed(() => props.options.find(option => option.value === props.modelValue));
async function reveal() {
  if(props.disabled || !props.options.length) return;
  active.value=Math.max(0,props.options.findIndex(option => option.value === props.modelValue));
  open.value=true;
  await scrollActive();
}
async function scrollActive() { await nextTick(); list.value?.children[active.value]?.scrollIntoView({block:'nearest'}); }
function choose(option) { emit('update:modelValue',option.value); open.value=false; trigger.value?.focus(); }
function keys(event) {
  if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
    event.preventDefault();
    if(!open.value) { reveal(); return; }
    active.value=event.key==='Home'?0:event.key==='End'?props.options.length-1:Math.max(0,Math.min(props.options.length-1,active.value+(event.key==='ArrowDown'?1:-1)));
    scrollActive();
  } else if(event.key==='Enter' || event.key===' ') {
    event.preventDefault();
    if(open.value && props.options[active.value]) choose(props.options[active.value]); else reveal();
  } else if(event.key==='Escape' || event.key==='Tab') { open.value=false; }
}
function outside(event) { if(!root.value?.contains(event.target)) open.value=false; }
watch(() => props.disabled,value => { if(value) open.value=false; });
onMounted(() => document.addEventListener('pointerdown',outside));
onBeforeUnmount(() => document.removeEventListener('pointerdown',outside));
</script>
<template>
  <div ref="root" class="compact-select" @focusout="event => { if(!root?.contains(event.relatedTarget)) open=false; }">
    <button :id="id" ref="trigger" type="button" role="combobox" :disabled="disabled" :aria-expanded="open" :aria-controls="listId" aria-haspopup="listbox" :aria-activedescendant="open ? `${listId}-${active}` : undefined" class="compact-select-trigger" @click="open ? open=false : reveal()" @keydown="keys"><span>{{ selected?.label || placeholder }}</span><ChevronDown :size="17" aria-hidden="true" /></button>
    <div v-if="open" :id="listId" ref="list" role="listbox" :aria-label="placeholder" class="compact-select-list">
      <div v-for="(option,index) in options" :id="`${listId}-${index}`" :key="option.value" role="option" :aria-selected="option.value===modelValue" class="compact-select-option" :class="{active:index===active,selected:option.value===modelValue}" @pointerdown.prevent @click="choose(option)" @pointermove="active=index"><span>{{ option.label }}</span><Check v-if="option.value===modelValue" :size="16" aria-hidden="true" /></div>
    </div>
  </div>
</template>
<style scoped>
.compact-select { position:relative; min-width:0; }
.compact-select-trigger { display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; min-height:46px; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:var(--soft); color:var(--ink); font-size:13px; text-align:left; }
.compact-select-trigger>span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.compact-select-trigger>svg { flex-shrink:0; }
.compact-select-trigger:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
.compact-select-list { position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:30; max-height:min(220px,35dvh); overflow-y:auto; overscroll-behavior:contain; padding:5px; border:1px solid var(--line); border-radius:12px; background:var(--surface); box-shadow:0 8px 24px #11243a20; color:var(--ink); }
.compact-select-option { display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:38px; padding:7px 10px; border-radius:7px; font-size:13px; line-height:1.7; cursor:pointer; overflow-wrap:anywhere; }
.compact-select-option.active { background:var(--soft); }
.compact-select-option.selected { color:var(--blue); }
.compact-select-option>svg { flex-shrink:0; }
</style>
