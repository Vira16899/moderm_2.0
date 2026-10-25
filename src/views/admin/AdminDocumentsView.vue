<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { FileCheck2, FileText, UserRound, Download, RefreshCw, Eye, CheckCircle2, AlertCircle } from 'lucide-vue-next';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseSkeleton from '../../components/base/BaseSkeleton.vue';
import { employmentLetter, employmentFilename, employmentUserBody, employmentEligibleUsers, letterValue, letterDate, letterSalary } from '../../api/employmentVerification.js';
import { buildEmploymentPdf } from '../../utils/employmentVerificationPdf.js';
import { adminErrorMessage } from '../../utils/adminMessages.js';
import { notify } from '../../stores/toasts.js';
const props = defineProps({onGet:Function,onCreate:Function,users:{type:Array,default:()=>[]},usersLoading:Boolean,usersError:String,onRetryUsers:Function});
const userId=ref(''), busy=ref(''), error=ref(''), fieldError=ref(''), letter=ref(null), pdfUrl=ref(''), previewUrl=ref('');
const zoom=ref(false);
let disposed=false;
function clearUrls(){ if(pdfUrl.value)URL.revokeObjectURL(pdfUrl.value);if(previewUrl.value)URL.revokeObjectURL(previewUrl.value);pdfUrl.value='';previewUrl.value=''; }
onBeforeUnmount(()=>{disposed=true;clearUrls();});
watch(userId,()=>{fieldError.value='';error.value='';letter.value=null;clearUrls();});
const sortedUsers=computed(()=>employmentEligibleUsers(props.users));
const employee=computed(()=>letter.value?.employee);
const info=computed(()=>employee.value?[
 ['ឈ្មោះជាខ្មែរ',letterValue(employee.value.khmer_name)],['ឈ្មោះជាឡាតាំង',letterValue(employee.value.Eng_name)],
 ['មុខតំណែង',letterValue(employee.value.position_name)],['នាយកដ្ឋាន',letterValue(employee.value.department_name)],
 ['កាលបរិច្ឆេទចូលធ្វើការ',letterDate(employee.value.hire_date)],['ប្រាក់បៀវត្សប្រចាំខែ',letterSalary(employee.value.salary)],
]:[]);
async function preparePdf(){
 if(!letter.value)return;
 const current=letter.value;
 clearUrls();
 const output=await buildEmploymentPdf(current);
 if(disposed || letter.value!==current)return;
 pdfUrl.value=URL.createObjectURL(new Blob([output.bytes],{type:'application/pdf'}));
 previewUrl.value=URL.createObjectURL(output.previewBlob);
}
async function rebuild(){
 if(busy.value||!letter.value)return;
 busy.value='pdf';error.value='';
 try{await preparePdf();}catch(cause){if(!disposed){error.value=adminErrorMessage(cause);notify(error.value,'error');}}
 finally{busy.value='';}
}
async function run(type){
 if(busy.value)return;
 fieldError.value='';error.value='';
 try{employmentUserBody(userId.value);}catch(cause){fieldError.value=cause.message;return;}
 if(props.users.some(user=>String(Number(user.id))===String(Number(userId.value))) && !sortedUsers.value.some(user=>String(user.id)===String(Number(userId.value)))){fieldError.value='សូមជ្រើសរើសគណនីអ្នកគ្រប់គ្រង ឬបុគ្គលិកប៉ុណ្ណោះ។';return;}
 const action=type==='create'?props.onCreate:props.onGet;
 if(!action)return;
 busy.value=type;clearUrls();letter.value=null;
 try{
   const payload=await action(userId.value);
   if(disposed)return;
   letter.value=employmentLetter(payload,userId.value);
   busy.value='pdf';
   await preparePdf();
   if(!disposed)notify('លិខិតបញ្ជាក់ការងារត្រូវបានរៀបចំរួចរាល់។ អ្នកអាចទាញយក PDF បាន។');
 }catch(cause){if(!disposed){error.value=adminErrorMessage(cause);notify(error.value,'error');}}
 finally{busy.value='';}
}
</script>
<template>
 <section class="documents-page">
  <header class="documents-heading"><div><h1>លិខិតបញ្ជាក់ការងារ</h1><p>ជ្រើសរើសបុគ្គលិក ដើម្បីរៀបចំ ពិនិត្យ និងទាញយកលិខិតជា PDF។</p></div><span class="document-format"><FileText :size="17"/>A4 · PDF</span></header>
  <div class="documents-grid">
   <section class="documents-panel documents-controls" aria-labelledby="document-controls-title"><header class="documents-panel-heading"><span class="documents-icon"><UserRound :size="21"/></span><div><h2 id="document-controls-title">ព័ត៌មានបុគ្គលិក</h2><p>ប្រើព័ត៌មានបុគ្គលិកពីប្រព័ន្ធ</p></div></header>
    <form novalidate @submit.prevent="run('create')"><fieldset :disabled="!!busy"><label for="document-employee">ជ្រើសរើសបុគ្គលិក</label><select id="document-employee" v-model="userId" :disabled="usersLoading || !sortedUsers.length"><option value="" disabled>{{ usersLoading ? 'កំពុងទាញយកបុគ្គលិក…' : 'ជ្រើសរើសឈ្មោះបុគ្គលិក' }}</option><option v-for="user in sortedUsers" :key="user.id" :value="String(user.id)">{{ user.nameKh || user.nameEn }} · {{ user.id }}</option></select><p v-if="usersError" class="document-field-error">{{ usersError }} <button type="button" class="text-button" @click="onRetryUsers?.()">ព្យាយាមម្ដងទៀត</button></p><label for="document-user-id">លេខសម្គាល់បុគ្គលិក</label><input id="document-user-id" v-model="userId" inputmode="numeric" autocomplete="off" placeholder="ឧ. 3" :aria-invalid="!!fieldError" :aria-describedby="fieldError?'document-id-error':undefined"/><p v-if="fieldError" id="document-id-error" class="document-field-error">{{ fieldError }}</p><BaseButton type="submit" class="document-control-button" :loading="busy==='create'" :disabled="!!busy || !onCreate"><FileCheck2 :size="18"/>បង្កើតលិខិត</BaseButton></fieldset></form>
    <p class="document-help">PDF ប្រើគំរូលិខិតដែលបានផ្តល់។ ព័ត៌មានដែលមិនមានក្នុងប្រព័ន្ធនឹងបង្ហាញថា «មិនបានផ្តល់»។</p>
    <div v-if="letter" class="document-employee-summary"><h3><CheckCircle2 :size="17"/>ព័ត៌មានសម្រាប់លិខិត</h3><dl><div v-for="[label,value] in info" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div><div><dt>កាលបរិច្ឆេទចេញលិខិត</dt><dd>{{ letterDate(letter.generatedAt) }}</dd></div></dl></div>
   </section>
   <section class="documents-panel document-preview-panel" aria-labelledby="document-preview-title" :aria-busy="!!busy"><header class="document-preview-heading"><div><h2 id="document-preview-title"><Eye :size="19"/>មើលលិខិតជាមុន</h2><p>{{ letter ? letter.documentType : 'លិខិតបញ្ជាក់ការងារបុគ្គលិក' }}</p></div><div v-if="pdfUrl && !busy" class="document-preview-actions"><BaseButton variant="ghost" size="sm" @click="zoom=!zoom">{{ zoom?'បង្រួម':'ពង្រីក' }}</BaseButton><a :href="pdfUrl" :download="employmentFilename(letter)" class="document-download"><Download :size="17"/>ទាញយក PDF</a></div></header>
    <div v-if="busy" class="document-loading" role="status"><BaseSkeleton :lines="7"/><p>{{ busy==='pdf'?'កំពុងរៀបចំ PDF…':'កំពុងទាញយកព័ត៌មានបុគ្គលិក…' }}</p></div>
    <div v-else-if="error" class="document-empty"><AlertCircle :size="38"/><h3>មិនអាចរៀបចំលិខិតបានទេ</h3><p>{{ error }}</p><BaseButton v-if="letter" variant="outline" @click="rebuild"><RefreshCw :size="17"/>រៀបចំ PDF ម្ដងទៀត</BaseButton></div>
    <template v-else-if="previewUrl"><div class="document-preview-scroll" tabindex="0" role="region" aria-label="មើលទំព័រលិខិត PDF" :class="{zoomed:zoom}"><img :src="previewUrl" alt="លិខិតបញ្ជាក់ការងារដែលបានបញ្ចូលព័ត៌មានបុគ្គលិក"/></div><p class="document-signature-note">ព័ត៌មានក្រុមហ៊ុន និងហត្ថលេខាត្រូវបំពេញដោយអ្នកមានសិទ្ធិ។ គំរូនេះមិនមានហត្ថលេខា ឬត្រាក្រុមហ៊ុនទេ។</p></template>
    <div v-else class="document-empty"><span class="document-empty-icon"><FileText :size="42" :stroke-width="1.5"/></span><h3>លិខិតនឹងបង្ហាញនៅទីនេះ</h3><p>ជ្រើសរើសបុគ្គលិក រួចចុច «បង្កើតលិខិត» ដើម្បីពិនិត្យមុនទាញយក។</p></div>
   </section>
  </div>
 </section>
</template>
<style scoped>
.documents-page { display:grid; gap:24px; min-width:0; }
.documents-heading,.document-preview-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; }
.documents-heading h1 { margin:0 0 8px; font-size:clamp(24px,2.3vw,30px); color:var(--ink); font-weight:700; }
.documents-heading p,.document-preview-heading p { margin:0; font-size:13px; color:var(--muted); line-height:1.8; }
.document-format { display:flex; align-items:center; gap:8px; padding:10px 14px; border:1px solid var(--line); border-radius:12px; color:var(--muted); font-size:13px; white-space:nowrap; }
.documents-grid { display:grid; grid-template-columns:340px minmax(0,1fr); gap:24px; align-items:stretch; }
.documents-panel { border:1px solid var(--line); border-radius:20px; background:var(--surface); min-width:0; padding:24px; }
.documents-panel-heading { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
.documents-icon { display:grid; place-items:center; width:44px; height:44px; flex-shrink:0; border-radius:13px; color:var(--blue); background:var(--soft); }
.documents-panel h2 { display:flex; align-items:center; gap:8px; margin:0 0 6px; font-size:18px; font-weight:650; color:var(--ink); }
.documents-panel-heading p { margin:0; font-size:12px; color:var(--muted); }
.documents-controls fieldset { border:0; padding:0; margin:0; min-width:0; }
.documents-controls label { display:block; margin:16px 0 9px; font-size:13px; font-weight:600; color:var(--ink); }
.documents-controls :is(input,select) { width:100%; min-width:0; min-height:46px; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:var(--soft); color:var(--ink); font-size:13px; }
.document-control-button { width:100%; margin-top:14px; }
.document-help { margin:20px 0 0; color:var(--muted); font-size:12px; line-height:1.9; }
.document-field-error { color:#be3450; font-size:12px; line-height:1.8; margin:8px 0; }
.documents-controls [aria-invalid="true"] { border-color:#be3450; }
.document-employee-summary { margin-top:24px; padding-top:20px; border-top:1px solid var(--line); }
.document-employee-summary h3 { display:flex; align-items:center; gap:8px; color:var(--blue); font-size:14px; font-weight:600; margin:0 0 18px; }
.document-employee-summary dl { display:grid; gap:16px; margin:0; }
.document-employee-summary dt { color:var(--muted); font-size:12px; margin-bottom:5px; }
.document-employee-summary dd { margin:0; font-size:13px; color:var(--ink); overflow-wrap:anywhere; }
.document-preview-heading { margin-bottom:20px; flex-wrap:wrap; }
.document-preview-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.document-download { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:10px 16px; border-radius:12px; background:var(--action-fill); color:white; font-size:13px; font-weight:600; text-decoration:none; }
.document-preview-scroll { padding:20px; background:var(--soft); border:1px solid var(--line); border-radius:14px; max-height:820px; overflow:auto; }
.document-preview-scroll img { display:block; width:100%; height:auto; margin:auto; background:white; box-shadow:0 6px 24px #14374a1a; }
.document-preview-scroll.zoomed img { width:900px; max-width:none; }
.document-signature-note { color:var(--muted); font-size:12px; line-height:1.9; margin:16px 0 0; }
.document-empty { display:flex; flex-direction:column; justify-content:center; align-items:center; gap:16px; text-align:center; min-height:400px; border:1px dashed var(--line); border-radius:16px; background:var(--soft); padding:30px; color:var(--blue); }
.document-empty h3 { margin:0; font-size:17px; font-weight:600; color:var(--ink); }
.document-empty p { margin:0; max-width:380px; font-size:13px; line-height:1.9; color:var(--muted); }
.document-empty-icon { display:grid; place-items:center; width:80px; height:80px; border-radius:20px; background:var(--surface); }
.document-loading { min-height:400px; padding:24px; background:var(--soft); border-radius:16px; }
.document-loading p { font-size:13px; color:var(--muted); margin:20px 0; }
.documents-page :is(input,select,button,a):focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
@media(max-width:1000px) { .documents-grid { grid-template-columns:300px minmax(0,1fr); gap:18px; } .documents-panel { padding:20px; } }
@media(max-width:800px) { .documents-grid { grid-template-columns:1fr; } }
@media(max-width:540px) { .documents-page { gap:18px; } .documents-heading { flex-direction:column; align-items:flex-start; gap:12px; } .documents-panel { padding:18px; } .document-preview-scroll { padding:8px; } .document-preview-actions { width:100%; } .document-download { flex:1; } }
</style>
