<script setup>
import { computed, onMounted, ref } from 'vue';
import { employeeApi } from '@/api/employeeApi';
import { dateOnly, money, salaryHistory } from '@/api/employeeData';
import { Wallet } from 'lucide-vue-next';
import { notify } from '@/stores/toasts';
import { employeeError } from '@/utils/employeeMessages';
defineOptions({ inheritAttrs: false });
const rows = ref([]);
const loading = ref(false);
const error = ref('');
const latest = computed(() => rows.value[0]);
async function load() {
  loading.value = true;
  error.value = '';
  try { rows.value = salaryHistory(await employeeApi.getSalaryHistory()); }
  catch (cause) { error.value = employeeError(cause, 'មិនអាចទាញយកប្រវត្តិប្រាក់ខែបានទេ។'); notify(error.value, 'error'); }
  finally { loading.value = false; }
}
onMounted(load);
</script>
<template>
  <div class="ess-page">
    <header class="ess-header"><div><h1>ប្រវត្តិប្រាក់បៀវត្សរបស់ខ្ញុំ</h1><p class="ess-muted">ព័ត៌មានប្រាក់ខែ និងការផ្លាស់ប្ដូរប្រាក់បៀវត្ស</p></div></header>
    <p v-if="loading" class="ess-empty" role="status">កំពុងទាញយកប្រវត្តិប្រាក់ខែ…</p>
    <template v-else>
      <div class="ess-grid"><div class="ess-metric"><Wallet :size="22" /><p class="ess-muted">ប្រាក់បៀវត្សចុងក្រោយ</p><strong>{{ money(latest?.salary) }}</strong><p class="ess-muted">{{ dateOnly(latest?.date) || 'មិនទាន់មានទិន្នន័យ' }}</p></div><div class="ess-metric"><p class="ess-muted">ប្រាក់បៀវត្សមុន</p><strong>{{ money(latest?.previous) }}</strong></div><div class="ess-metric"><p class="ess-muted">ចំនួនកំណត់ត្រា</p><strong>{{ rows.length }}</strong></div></div>
      <section class="ess-panel"><h2>ប្រវត្តិប្រាក់បៀវត្ស</h2><div v-if="rows.length" class="ess-table-wrap"><table class="ess-table"><thead><tr><th>កាលបរិច្ឆេទ</th><th>ប្រាក់បៀវត្សមុន</th><th>ប្រាក់បៀវត្សថ្មី</th><th>ប្រាក់ខែសុទ្ធ</th><th>ការពិពណ៌នា</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id"><td>{{ dateOnly(row.date) || '—' }}</td><td>{{ money(row.previous) }}</td><td>{{ money(row.salary) }}</td><td>{{ money(row.netSalary) }}</td><td class="ess-reason">{{ row.description || '—' }}</td></tr></tbody></table></div><p v-else class="ess-empty">{{ error ? 'មិនអាចបង្ហាញប្រវត្តិបានទេ។ សូមព្យាយាមម្ដងទៀត។' : 'មិនទាន់មានប្រវត្តិប្រាក់បៀវត្សទេ។' }}</p></section>
    </template>
  </div>
</template>
