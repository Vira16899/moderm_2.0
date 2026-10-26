import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { installCompactSelects } from './utils/compactSelects.js';
import router from './router';
import './styles/index.css';
import './styles/workspace.css';
import './styles/auth.css';
import './styles/employee.css';
import './styles/polish.css';
import './styles/consistency.css';
import './styles/dark-theme.css';
import './styles/motion.css';

installCompactSelects(document);
createApp(App).use(createPinia()).use(router).mount('#root');
