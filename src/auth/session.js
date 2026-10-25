export const ROLES = Object.freeze({ 1: 'ADMIN', 2: 'MANAGER', 3: 'EMPLOYEE' });
export const dashboardPath = (user) => `/${user.role.toLowerCase()}/dashboard`;
export const unwrap = (payload) => payload?.data?.data ?? payload?.data ?? payload;

export function authError(error, phase = 'login') {
  const status = error.response?.status;
  const payload = error.response?.data;
  const message = payload?.message || payload?.msg || payload?.error || error.message;
  if (status === 429) return 'អ្នកបានព្យាយាមច្រើនដងពេក។ សូមរង់ចាំ មុនពេលព្យាយាមម្តងទៀត។';
  if (!error.response && error.request) return 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។';
  if (status >= 500) return 'ម៉ាស៊ីនមេមិនអាចបំពេញសំណើនេះបានទេ។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។';
  if (status === 403 || /inactive|access.*denied|unsupported.*role/i.test(String(message))) return 'គណនីរបស់អ្នកមិនមានសិទ្ធិចូលប្រើទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ។';
  if (typeof message === 'string' && /[\u1780-\u17ff]/.test(message) && !/[A-Za-z]/.test(message)) return message;
  if (phase === 'verify' && [400, 401, 422].includes(status)) return 'លេខកូដមិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមព្យាយាមម្តងទៀត ឬស្នើសុំលេខកូដថ្មី។';
  if (phase === 'login' && [400, 401, 422].includes(status)) return 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។ សូមពិនិត្យ ហើយព្យាយាមម្តងទៀត។';
  if (/expired|sign in again|session/i.test(String(message)) || status === 401) return 'វគ្គប្រើប្រាស់របស់អ្នកបានផុតកំណត់។ សូមចូលប្រព័ន្ធម្តងទៀត។';
  return 'មិនអាចបំពេញសំណើរបស់អ្នកបានទេ។ សូមព្យាយាមម្តងទៀត។';
}

export function normalizeUser(payload) {
  const data = unwrap(payload);
  const user = data?.user ?? data;
  const role = ROLES[Number(user?.role_id)];
  if (!role) throw new Error('Unsupported account role. Contact your administrator.');
  if (user.is_active != null && ['false', '0'].includes(String(user.is_active).toLowerCase()) ||
      (user.status != null && !['active', '1', 'true'].includes(String(user.status).toLowerCase()))) {
    throw new Error('Your account is inactive. Contact your administrator.');
  }
  return { ...user, role, id: String(user.id ?? user.user_id ?? ''),
    nameKh: user.nameKh ?? user.khmer_name ?? '', nameEn: user.nameEn ?? user.Eng_name ?? user.eng_name ?? user.name ?? '',
    departmentId: String(user.departmentId ?? user.department_id ?? ''),
    avatar: user.avatar ?? user.profile_image ?? '', salary: Number(user.salary ?? user.base_salary ?? 0) };
}

// Access tokens stay in memory. A refresh token and pending challenge survive reloads
// only in this tab; neither identity nor roles are loaded from browser storage.
export function createSession({ request, storage, state = { user: null, message: '' }, now = Date.now }) {
  let accessToken = null;
  let verifiedAt = null;
  let refreshPromise;
  let generation = 0;
  const refreshKey = 'modern_factory_refresh';
  const challengeKey = 'modern_factory_challenge';
  const adminTokenKey = 'adminToken';
  const clear = (message = '') => {
    generation++;
    verifiedAt = null;
    refreshPromise = undefined;
    accessToken = null;
    state.user = null;
    state.message = message;
    storage.removeItem(refreshKey);
    storage.removeItem(challengeKey);
    storage.removeItem(adminTokenKey);
  };
  const handleFailure = (error, version) => {
    if (version !== generation) return;
    verifiedAt = null;
    const status = error.response?.status;
    if ((!error.response && error.request) || [408, 425, 429].includes(status) || status >= 500) {
      // A temporary failure does not prove that the refresh token is invalid.
      // Keep the latest token, including one rotated before /getMe failed.
      accessToken = null;
      state.user = null;
      state.message = authError(error, 'session');
    } else clear(authError(error, 'session'));
  };
  const call = async (method, url, data, authenticated = false) => {
    const response = await request({ method, url, data, skipAuth: !authenticated,
      ...(authenticated ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}) });
    if (response.data?.result === false) throw new Error(response.data.message || response.data.msg || 'Request failed.');
    return response;
  };
  const tokens = (payload, requireRefresh = true) => {
    const data = unwrap(payload);
    if (typeof data?.accessToken !== 'string' || !data.accessToken ||
        (requireRefresh && (typeof data?.refreshToken !== 'string' || !data.refreshToken))) {
      throw new Error('The server returned an incomplete authentication response.');
    }
    if (data.refreshToken) storage.setItem(refreshKey, data.refreshToken);
    accessToken = data.accessToken;
    verifiedAt = null;
  };
  async function refresh() {
    if (refreshPromise) return refreshPromise;
    const refreshToken = storage.getItem(refreshKey);
    if (!refreshToken) { clear('Your session has expired. Please sign in again.'); throw new Error(state.message); }
    const version = generation;
    const pending = (async () => {
      try {
        const response = await call('POST', '/refresh-token', { refreshToken });
        if (version !== generation) throw new Error('Session changed. Please sign in again.');
        tokens(response.data, false);
        const me = await call('GET', '/getMe', undefined, true);
        if (version !== generation) throw new Error('Session changed. Please sign in again.');
        state.user = normalizeUser(me.data);
        verifiedAt = now();
        state.message = '';
        return accessToken;
      } catch (error) {
        handleFailure(error, version);
        throw error;
      } finally { if (version === generation) refreshPromise = undefined; }
    })();
    refreshPromise = pending;
    return refreshPromise;
  }
  async function verifyUser({ maxAge = 0 } = {}) {
    if (maxAge > 0 && accessToken && state.user && verifiedAt !== null &&
        now() >= verifiedAt && now() - verifiedAt < maxAge) return state.user;
    if (!accessToken) {
      if (!storage.getItem(refreshKey)) return null;
      await refresh();
      return state.user;
    }
    const version = generation;
    const requestedToken = accessToken;
    try {
      const response = await call('GET', '/getMe', undefined, true);
      if (version !== generation) throw new Error('Session changed. Please sign in again.');
      state.user = normalizeUser(response.data);
      verifiedAt = now();
      state.message = '';
      return state.user;
    } catch (error) {
      if (error.response?.status === 401 && version === generation) {
        if (accessToken && accessToken !== requestedToken) return verifyUser();
        await refresh();
        return state.user;
      }
      handleFailure(error, version);
      throw error;
    }
  }
  async function complete(payload, expectedRole, version) {
    try {
      if (version !== generation) throw new Error('Session changed. Please sign in again.');
      tokens(payload);
      const user = await verifyUser();
      if (version !== generation) throw new Error('Session changed. Please sign in again.');
      if (user.role !== expectedRole) throw new Error('The verified role does not match the login response.');
      storage.removeItem(challengeKey);
      storage.removeItem(adminTokenKey);
      return user;
    } catch (error) { handleFailure(error, version); throw error; }
  }
  return {
    state, clear, refresh, verifyUser,
    getAccessToken: () => accessToken,
    getSessionVersion: () => generation,
    getChallenge: () => storage.getItem(adminTokenKey) || storage.getItem(challengeKey),
    async login(email, password) {
      clear();
      const version = generation;
      const response = await call('POST', '/login', { email: email.trim(), password });
      if (version !== generation) throw new Error('Session changed. Please sign in again.');
      const data = unwrap(response.data);
      // This is a pending admin challenge, not an authenticated session. The
      // backend intentionally omits role_id until OTP verification succeeds.
      if (response.data?.result === true && response.data?.requiresVerification === true &&
          data?.requiresAdminVerification === true && typeof data.adminToken === 'string' && data.adminToken) {
        storage.setItem(adminTokenKey, data.adminToken);
        return null;
      }
      if (response.data?.requiresVerification === true || data?.requiresAdminVerification === true) {
        throw new Error(response.data?.msg || 'Admin login returned an incomplete OTP challenge. Please sign in again.');
      }
      if (!data?.accessToken && !data?.challengeToken) {
        throw new Error(response.data?.msg || response.data?.message || 'Login failed');
      }
      const role = ROLES[Number(data?.role_id ?? data?.user?.role_id)];
      if (!role) throw new Error('Unsupported account role. Contact your administrator.');
      if (role === 'ADMIN') {
        if (response.status !== 202 || typeof data.challengeToken !== 'string' || !data.challengeToken) {
          throw new Error('Admin login requires an OTP challenge from the server.');
        }
        storage.setItem(challengeKey, data.challengeToken);
        return null;
      }
      if (response.status === 202) throw new Error('Unexpected OTP challenge for this account.');
      return complete(response.data, role, version);
    },
    async verifyOtp(otp) {
      const adminToken = storage.getItem(adminTokenKey);
      const challengeToken = storage.getItem(challengeKey);
      if (!adminToken && !challengeToken) throw new Error('The OTP challenge has expired. Please sign in again.');
      const version = generation;
      const response = await call('POST', '/admin/verify-otp', adminToken ? { otp, adminToken } : { otp, challengeToken });
      return complete(response.data, 'ADMIN', version);
    },
    async resendOtp() {
      const adminToken = storage.getItem(adminTokenKey);
      const challengeToken = storage.getItem(challengeKey);
      if (!adminToken && !challengeToken) throw new Error('Please sign in again to request an OTP.');
      const version = generation;
      const response = await call('POST', '/resend-admin-otp', adminToken ? { adminToken } : { challengeToken });
      if (version !== generation) throw new Error('Session changed. Please sign in again.');
      const data = unwrap(response.data);
      if (data?.adminToken) storage.setItem(adminTokenKey, data.adminToken);
      if (data?.challengeToken) storage.setItem(challengeKey, data.challengeToken);
    },
    async logout() {
      try {
        if (!accessToken && storage.getItem(refreshKey)) await refresh();
        if (accessToken) await call('PUT', '/logout', { refreshToken: storage.getItem(refreshKey) }, true);
        clear();
      } catch (error) { clear(`Signed out locally. Server sign-out failed: ${authError(error)}`); }
    },
  };
}
