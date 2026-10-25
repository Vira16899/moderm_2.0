<script setup>
import { computed, ref } from "vue";
import { Clock, Search, User } from "lucide-vue-next";
import { labels } from "../../data/labels";

const props = defineProps({ logs: { type: Array, default: () => [] } });
const searchTerm = ref("");
const moduleFilter = ref("ALL");
const modules = computed(() => Array.from(new Set(props.logs.map((log) => log.module))));
const filteredLogs = computed(() => {
  const term = searchTerm.value.toLowerCase();
  return props.logs.filter((log) => {
    const matchesSearch = [log.activityKh, log.activityEn, log.user, log.action, log.module]
      .some((value) => (value || "").toLowerCase().includes(term));
    return matchesSearch && (moduleFilter.value === "ALL" || log.module === moduleFilter.value);
  });
});
const actionClass = (action) => action === "CREATE"
  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
  : action === "APPROVE"
    ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
    : action === "SUBMIT"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      : action === "DEACTIVATE"
        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
        : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-200">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800 dark:text-white sm:text-3xl">កំណត់ហេតុសវនកម្ម និងសកម្មភាព</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">តាមដានសកម្មភាពអ្នកប្រើប្រាស់ ម៉ូឌុល និងកាលបរិច្ឆេទប្រតិបត្តិការទាំងអស់ក្នុងប្រព័ន្ធ</p>
      </div>
    </header>

    <section class="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row">
      <div class="relative w-full sm:w-80">
        <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input v-model="searchTerm" type="text" placeholder="ស្វែងរកតាមសកម្មភាព អ្នកប្រើប្រាស់ ឬម៉ូឌុល..." class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#003049] dark:border-slate-700 dark:bg-slate-900/50" />
      </div>
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <span class="text-xs font-semibold text-slate-400">ម៉ូឌុល:</span>
        <select v-model="moduleFilter" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">
          <option value="ALL">គ្រប់ម៉ូឌុលទាំងអស់</option>
          <option v-for="module in modules" :key="module" :value="module">{{ labels[module] || module }}</option>
        </select>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            <tr><th class="px-4 py-3.5">សកម្មភាព</th><th class="px-4 py-3.5">អ្នកប្រើប្រាស់</th><th class="px-4 py-3.5">ប្រភេទសកម្មភាព</th><th class="px-4 py-3.5">ម៉ូឌុល</th><th class="px-4 py-3.5 text-right">កាលបរិច្ឆេទ និងម៉ោង</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-if="!filteredLogs.length"><td colspan="5" class="py-8 text-center text-slate-400">រកមិនឃើញកំណត់ហេតុទេ</td></tr>
            <tr v-for="log in filteredLogs" :key="log.id" class="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
              <td class="max-w-xs px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{{ log.activityKh }}</td>
              <td class="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300"><div class="flex items-center gap-1.5"><User class="h-3.5 w-3.5 text-slate-400" /><span>{{ log.user }}</span></div></td>
              <td class="px-4 py-3.5"><span :class="['rounded px-2 py-0.5 text-xs font-bold uppercase', actionClass(log.action)]">{{ labels[log.action] || log.action }}</span></td>
              <td class="px-4 py-3.5"><span class="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ labels[log.module] || log.module }}</span></td>
              <td class="whitespace-nowrap px-4 py-3.5 text-right font-mono text-xs text-slate-400">{{ log.dateTime }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
