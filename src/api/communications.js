import { API_ENDPOINTS } from './endpoints.js';

export function communicationList(payload, key) {
  if (Array.isArray(payload)) return payload.filter(item => item && typeof item === 'object');
  if (!payload || typeof payload !== 'object') return [];
  for (const field of [key, 'data', 'items', 'rows']) {
    if (payload[field] != null) return communicationList(payload[field], key);
  }
  return [];
}

export function communicationItem(item) {
  const read = item.read ?? item.is_read ?? item.isRead;
  return {
    ...item,
    id: item.id ?? item.notification_id ?? item.announcement_id,
    title: item.title ?? item.titleKh ?? item.titleEn ?? '',
    message: item.message ?? item.messageKh ?? item.messageEn ?? item.body ?? '',
    read: read === true || read === 1 || read === '1' || read === 'true' || (read == null && Boolean(item.read_at)),
    timestamp: item.created_at ?? item.createdAt ?? item.timestamp ?? '',
  };
}

export function unreadCount(payload) {
  const value = payload?.data ?? payload;
  const count = Number(typeof value === 'object' && value !== null
    ? value.unread_count ?? value.unreadCount ?? value.count : value);
  if (!Number.isFinite(count) || count < 0) throw new Error('Invalid unread notification count.');
  return count;
}

export function announcementDetail(payload) {
  const value = payload?.data ?? payload;
  const item = value?.announcement ?? value?.data ?? value;
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Announcement details are unavailable.');
  return communicationItem(item);
}

export function createCommunicationsApi(request) {
  const n = API_ENDPOINTS.notifications;
  const a = API_ENDPOINTS.announcements;
  return {
    notifications: {
      list: () => request(n.list),
      unreadCount: () => request(n.unreadCount),
      read: id => request(n.read, { body: { id } }),
      readAll: () => request(n.readAll),
    },
    announcements: {
      list: () => request(a.list),
      detail: id => request(a.detail, { query: { id } }),
      create: ({ title, message }) => request(a.create, { body: { title, message } }),
      read: id => request(a.read, { body: { id } }),
      readAll: () => request(a.readAll),
      remove: id => request(a.remove, { query: { id } }),
    },
  };
}
