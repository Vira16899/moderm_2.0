import axios from 'axios';
import { reactive } from 'vue';
import { createSession } from './session.js';
import { createPasswordReset } from './passwordReset.js';
// Vite forwards local requests to the backend without requiring browser CORS.
export const API_BASE_URL = import.meta.env.DEV
  ? '/backend-api'
  : import.meta.env.VITE_API_BASE_URL || 'https://backend.factory.work.gd';
const transport = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
export const auth = createSession({
  request: (config) => transport.request(config),
  storage: sessionStorage,
  state: reactive({ user: null, message: '' }),
});
export const passwordReset = createPasswordReset({
  request: (config) => transport.request(config),
  storage: sessionStorage,
  state: reactive({ busy: false, notice: '' }),
});
