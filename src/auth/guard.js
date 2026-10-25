import { dashboardPath, authError } from './session.js';
export function createAuthGuard(auth) {
  return async (to, from) => {
    if (!to.meta.requiresAuth && !to.meta.guestOnly) return true;
    let user;
    const allowedRoles = to.meta.roles ?? (to.meta.role ? [to.meta.role] : null);
    // Reuse a recent server verification only within an authenticated workspace.
    // Initial entry, guest routes and cross-role navigation always check the server.
    const internalNavigation = to.meta.requiresAuth && from?.meta.requiresAuth &&
      auth.state.user && (!allowedRoles || allowedRoles.includes(auth.state.user.role));
    try { user = await auth.verifyUser({ maxAge: internalNavigation ? 15_000 : 0 }); }
    catch (error) { auth.state.message = authError(error); }
    if (!user) {
      if (to.meta.requiresAuth) return auth.getChallenge() ? '/verify-admin-otp' : '/login';
      if (to.meta.adminOtp && !auth.getChallenge()) return '/login';
      return true;
    }
    if (to.meta.guestOnly || (allowedRoles && !allowedRoles.includes(user.role))) return dashboardPath(user);
    return true;
  };
}
