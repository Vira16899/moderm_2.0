<script setup>
import { computed, ref, watch } from 'vue';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import BaseButton from './BaseButton.vue';
import BaseState from './BaseState.vue';
const props = defineProps({
  columns: { type: Array, required: true }, rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' }, caption: { type: String, required: true },
  loading: Boolean, error: String, pageSize: { type: Number, default: 10 },
  rowClickable: Boolean, rowLabel: Function,
  emptyText: { type: String, default: 'មិនមានទិន្នន័យសម្រាប់បង្ហាញទេ។' },
});
const emit = defineEmits(['retry', 'row-click']);
const page = ref(1), sortKey = ref(''), descending = ref(false);
const perPage = ref(props.pageSize);
watch(() => props.pageSize, value => { perPage.value = value; });
watch(perPage, () => { page.value = 1; });
const sorted = computed(() => {
  if (!sortKey.value) return props.rows;
  return [...props.rows].sort((a, b) => String(a[sortKey.value] ?? '').localeCompare(String(b[sortKey.value] ?? ''), 'km', { numeric: true }) * (descending.value ? -1 : 1));
});
const pages = computed(() => Math.max(1, Math.ceil(sorted.value.length / perPage.value)));
const visible = computed(() => sorted.value.slice((page.value - 1) * perPage.value, page.value * perPage.value));
const pageNumbers = computed(() => {
  const numbers = new Set([1, pages.value, page.value - 1, page.value, page.value + 1]);
  const result = [];
  [...numbers].filter(value => value > 0 && value <= pages.value).sort((a, b) => a - b).forEach(value => {
    if (result.length && value - result.at(-1) > 1) result.push(`gap-${value}`);
    result.push(value);
  });
  return result;
});
function activate(row, event) {
  if (!props.rowClickable || event.target.closest('button, a, input, select, textarea, [role="button"]')) return;
  if (event.type === 'keydown') {
    if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
  }
  emit('row-click', row);
}
watch(() => props.rows, () => { page.value = 1; });
watch(pages, count => { page.value = Math.min(page.value, count); });
function sort(column) { if (sortKey.value === column.key) descending.value = !descending.value; else { sortKey.value = column.key; descending.value = false; } page.value = 1; }
</script>
<template>
  <section class="base-table-panel" :aria-busy="loading">
    <span v-if="loading" role="status" class="sr-only">កំពុងទាញយកព័ត៌មាន…</span>
    <div class="base-table-scroll" tabindex="0" role="region" :aria-label="caption">
      <table class="base-table"><caption class="sr-only">{{ caption }}</caption><thead><tr><th v-for="column in columns" :key="column.key" scope="col" :class="{ 'table-align-right': column.align === 'right' }" :aria-sort="column.sortable ? sortKey === column.key ? descending ? 'descending' : 'ascending' : 'none' : undefined"><button v-if="column.sortable" type="button" class="table-sort" @click="sort(column)">{{ column.label }}<ArrowDown v-if="sortKey === column.key && descending" :size="14"/><ArrowUp v-else-if="sortKey === column.key" :size="14"/></button><template v-else>{{ column.label }}</template></th></tr></thead>
        <tbody v-if="loading" class="table-loading" aria-hidden="true"><tr v-for="row in 5" :key="row"><td v-for="column in columns" :key="column.key"><span class="skeleton-bar"></span></td></tr></tbody>
        <tbody v-else-if="error"><tr><td :colspan="columns.length"><BaseState kind="error" :description="error"><BaseButton variant="outline" @click="emit('retry')">ព្យាយាមម្ដងទៀត</BaseButton></BaseState></td></tr></tbody>
        <tbody v-else-if="!rows.length"><tr><td :colspan="columns.length"><BaseState :description="emptyText"><template v-if="$slots['empty-action']" #default><slot name="empty-action" /></template></BaseState></td></tr></tbody>
        <tbody v-else><tr v-for="row in visible" :key="row[rowKey]" :data-row-key="row[rowKey]" :class="{ 'clickable-row': rowClickable }" :tabindex="rowClickable ? 0 : undefined" :aria-label="rowClickable ? rowLabel?.(row) : undefined" @click="activate(row, $event)" @keydown="activate(row, $event)"><td v-for="column in columns" :key="column.key" :class="{ 'table-align-right': column.align === 'right' }"><slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">{{ row[column.key] ?? '—' }}</slot></td></tr></tbody>
      </table>
    </div>
    <footer v-if="!loading && !error && rows.length" class="table-pagination">
      <div class="pagination-summary"><span role="status">បង្ហាញ <strong>{{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, rows.length) }}</strong> នៃ {{ rows.length }}</span></div>
      <nav class="pagination-controls" aria-label="ទំព័រតារាង"><button type="button" class="pagination-arrow" aria-label="ទំព័រមុន" :disabled="page <= 1" @click="page--"><ChevronLeft :size="17"/></button><template v-for="number in pageNumbers" :key="number"><button v-if="typeof number === 'number'" type="button" class="pagination-number" :class="{ selected: page === number }" :aria-label="`ទំព័រ ${number}`" :aria-current="page === number ? 'page' : undefined" @click="page = number">{{ number }}</button><span v-else class="pagination-gap" aria-hidden="true">…</span></template><button type="button" class="pagination-arrow" aria-label="ទំព័របន្ទាប់" :disabled="page >= pages" @click="page++"><ChevronRight :size="17"/></button></nav>
    </footer>
  </section>
</template>
