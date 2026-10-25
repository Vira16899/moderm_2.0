<script setup>
import { Shirt } from 'lucide-vue-next';
defineProps({ compact: Boolean });
</script>
<template><div class="brand-logo"><span class="brand-mark"><Shirt :size="25"/></span><div v-if="!compact"><strong>GarmentPro<span class="brand-dot">.</span></strong><small>ប្រព័ន្ធគ្រប់គ្រងផលិតកម្ម</small></div></div></template>
