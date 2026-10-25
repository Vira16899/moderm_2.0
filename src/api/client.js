import http, { API_BASE_URL } from "./http";
import { auth as session } from '../auth/index.js';

export function getAccessToken() {
  return session.getAccessToken();
}

function validationMessage(payload) {
  const details = payload?.errors ?? payload?.details ?? payload?.validationErrors ?? payload?.validation_errors;
  if (Array.isArray(details)) {
    return details.map((item) => {
      if (typeof item === 'string') return item;
      const field = item?.field ?? item?.path ?? item?.param;
      const message = item?.message ?? item?.msg ?? item?.error;
      return [field, message].filter(Boolean).join(': ');
    }).filter(Boolean).join('; ');
  }
  if (details && typeof details === 'object') {
    return Object.entries(details).map(([field, value]) => {
      const message = Array.isArray(value) ? value.join(', ') : typeof value === 'object'
        ? value?.message ?? value?.msg ?? JSON.stringify(value)
        : value;
      return `${field}: ${message}`;
    }).join('; ');
  }
  return typeof details === 'string' ? details : '';
}

function apiErrorMessage(payload, fallback) {
  const message = payload?.message || payload?.msg || payload?.error;
  const details = validationMessage(payload);
  if (message && details && !String(message).includes(details)) return `${message}: ${details}`;
  return message || details || fallback;
}

export async function apiRequest(endpoint, { body, query, headers, auth = true } = {}) {
  if (!API_BASE_URL) {
    throw new Error("API URL is not configured. Set VITE_API_BASE_URL in your environment.");
  }

  try {
    const response = await http.request({
      // Browser GET requests cannot carry JSON bodies. Our same-origin server
      // forwards this POST as the backend's GET with its original JSON body.
      method: endpoint.browserBridge ? 'POST' : endpoint.method,
      url: endpoint.browserBridge ? `/backend-api${endpoint.path}` : endpoint.path,
      ...(endpoint.browserBridge ? { baseURL: '' } : {}),
      params: query,
      data: body,
      headers,
      skipAuth: !auth,
    });
    const payload = response.data;
    if (payload?.result === false) {
      throw new Error(apiErrorMessage(payload, "API request failed."));
    }
    return payload;
  } catch (error) {
    if (error.response) {
      const payload = error.response.data;
      throw new Error(apiErrorMessage(payload, `Request failed (${error.response.status}).`));
    }
    throw error;
  }
}
