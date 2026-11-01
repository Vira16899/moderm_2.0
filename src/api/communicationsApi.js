import { apiRequest } from './client';
import { createCommunicationsApi } from './communications.js';

export const { notifications: notificationsApi, announcements: announcementsApi } = createCommunicationsApi(apiRequest);
