import axios from "axios";
import { auth, API_BASE_URL } from '../auth/index.js';
import { installAuthInterceptors } from '../auth/interceptors.js';

export { API_BASE_URL };

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

installAuthInterceptors(http, auth);

export default http;
