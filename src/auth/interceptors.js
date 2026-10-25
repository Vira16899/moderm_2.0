export function installAuthInterceptors(http, auth) {
  async function refreshSession() {
    // The session owns refresh-token rotation and invalidation. Clearing here
    // would discard a valid refresh token after a timeout or temporary outage.
    return auth.refresh();
  }
  http.interceptors.request.use(async (config) => {
    if (config.skipAuth === true) {
      delete config.headers.Authorization;
      return config;
    }
    const token = auth.getAccessToken() || await refreshSession();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  http.interceptors.response.use((response) => response, async (error) => {
    const config = error.config;
    if (config && config.skipAuth !== true && error.response?.status === 401) {
      if (config._retried) {
        // An individual endpoint can reject a valid session. Only the identity
        // and refresh endpoints can decide whether the session is invalid.
        try { await auth.verifyUser(); } catch { /* Auth state carries the failure. */ }
        throw error;
      }
      config._retried = true;
      const currentToken = auth.getAccessToken();
      const sentAuthorization = config.headers?.Authorization;
      // Another request may already have rotated the rejected token. Refreshing
      // again would invalidate that request's new token on this backend.
      if (!currentToken || sentAuthorization === `Bearer ${currentToken}`) await refreshSession();
      return http.request(config);
    }
    if (config?.skipAuth !== true && error.response?.status === 403) {
      try { await auth.verifyUser(); } catch { /* Session state carries the error. */ }
    }
    throw error;
  });
}
