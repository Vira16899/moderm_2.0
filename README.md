# GarmentPro

A Vue 3 frontend for garment production and people management with administrator, manager, and employee workspaces.

## Run locally

```sh
npm install
# Copy .env.example to .env and adjust VITE_API_BASE_URL if needed.
npm run dev
```

Open http://localhost:3000. The backend defaults to http://localhost:5000.
Development requests use Vite's same-origin `/backend-api` proxy to avoid browser CORS failures. Its target is `VITE_API_PROXY_TARGET`, or `VITE_API_BASE_URL` when no proxy target is set. Restart Vite after changing these environment variables. Production builds use `VITE_API_BASE_URL` directly; the backend must allow the deployed frontend origin through CORS, or use a same-origin reverse proxy.
Use real backend credentials; demo login and simulated password recovery have been removed. Forgot-password recovery uses the backend OTP and reset-token endpoints.

## Authentication

- `POST /login` sends `{ email, password }`. Role IDs 1, 2, and 3 map to Admin, Manager, and Employee.
- Admin login checks `{ result: true, requiresVerification: true, data: { requiresAdminVerification: true, adminToken } }` before reading any role. It temporarily stores `data.adminToken` under `sessionStorage.adminToken` and navigates to `/verify-admin-otp`. This token only represents an OTP challenge; it never authenticates requests. Verification sends `{ otp, adminToken }` to `POST /admin/verify-otp`; resend sends `{ adminToken }` to `POST /resend-admin-otp`. Legacy HTTP 202 `challengeToken` responses and the `/verify-otp` URL remain supported.
- Manager and Employee receive `accessToken` and `refreshToken` immediately. Admin receives them only after OTP verification.
- `GET /getMe` verifies identity, active status, and `role_id` before granting access after login and reload. Navigation within an authenticated workspace can reuse a successful in-memory verification for up to 15 seconds to avoid blocking every page switch on a network request. Initial entry, cross-role navigation, guest routes, and explicit identity checks always verify with the backend. Verification failures and token changes invalidate the cached verification; API requests still enforce Bearer authentication and refresh on HTTP 401. Authentication payloads can be direct or wrapped in `data`; users can be wrapped in `user`. Authenticated login responses must include `role_id` directly or under `user`; pending admin challenges do not need a role. `/getMe` must include the verified user’s `role_id`.
- Dashboards are `/admin/dashboard`, `/manager/dashboard`, and `/employee/dashboard`. All workspace routes require authentication and their matching role. Cross-role URLs redirect to the verified user's dashboard. The attendance TV display remains public.
- Authenticated requests send a Bearer access token. HTTP 401 triggers a shared `POST /refresh-token` request with `{ refreshToken }`, verifies `/getMe`, and retries once. Invalid refresh credentials clear the session. Network failures deny access and allow retry.
- Sign-out calls `PUT /logout` with the Bearer token and `{ refreshToken }`, then clears local session state even if the server cannot be reached. A failed server sign-out is reported on the login page.
- Access tokens remain in memory. Refresh tokens and pending challenges use tab-scoped `sessionStorage`; no tokens or roles use `localStorage`. Remembered email and theme remain local preferences.

JavaScript-accessible storage cannot protect refresh tokens from XSS. For production, the backend should deliver the refresh token in a Secure, HttpOnly, SameSite cookie and support cookie-based refresh/logout; the provided JSON-token contract cannot implement that protection in the frontend alone. Deploy over HTTPS and enforce authorization on the backend as well.

Business screens still contain existing fixture data and local actions where no API integration was supplied. These fixtures no longer authenticate users or determine the signed-in role.

## Password recovery

Use **Forgot password?** on `/login`. The flow visits `/forgot-password`, `/verify-reset-otp`, and `/reset-password`, then returns to `/login` with a success message. Request and resend always display a generic message and never echo backend account-existence details.

Requests send `{ email }` to `/forgot-password` or `/resend-reset-otp`; verification sends `{ email, otp }` to `/verify-reset-otp`. The verification response must contain `data.resetToken` (a `data.token` response is also accepted). Reset sends exactly `{ token, newPassword, confirmPass }` with PUT `/reset-password`, using the saved reset token as `token`. Recovery never sends an access token or becomes a logged-in session.

Email and reset tokens use expiring tab-scoped session storage with a 15-minute maximum lifetime. OTP and passwords stay in component memory. Success or cancellation clears recovery state. A persisted 30-second resend deadline and a request lock prevent repeated submissions; HTTP 429 respects `Retry-After`. New passwords must match and use 8–30 characters with uppercase, lowercase, a number, and a special character, without whitespace.

The local backend has also been updated to exchange the verified OTP for a random, one-time reset token. It stores only the token hash and atomically requires a verified, unexpired token when updating the password, clearing reset state and existing login tokens. The previous email-only password-reset body is no longer accepted. Restart the backend if it is not running with automatic reload.

## Source structure

```text
src/
  api/                 # Axios base URL, request client, and endpoint modules
  assets/
    icons/
    images/
  components/
    base/              # Generic UI: BaseButton, BaseCard, BaseModal
    common/            # Shared application components: BrandLogo
    layout/            # Header, Sidebar
    modals/            # Feature dialogs: Logout, Profile, Notifications
  composables/         # Vue Composition API helpers: useDisclosure
  data/                # Demo fixtures, labels, navigation definitions
  i18n/                # Translations
  layouts/             # Shared application layouts and workspace state
  router/              # Vue Router configuration and navigation guards
  stores/              # Pinia shared workspace state
  styles/              # Global and workspace CSS
  utils/               # Helpers and existing JSX compatibility adapter
  views/
    admin/
    auth/
    employee/
    manager/
    shared/
  App.vue
  main.js
```

Use PascalCase for Vue components and `useSomething.js` for composables.
Keep page-level screens in `views`, business-specific UI in `components`, and
generic UI primitives in `components/base`. Base components should receive props
and emit events rather than read application state or call APIs. New components
can use `<script setup>`; existing JSX screens retain their compatibility helper.
The `@/` alias resolves to `src/` in Vite and the editor.

Workspace pages are rendered through Vue Router routes. `AppLayout.vue` supplies
the shared layout, and the Pinia workspace store holds state used by routed screens.
`localization-originals/` contains reference copies outside the active source tree.

### Base component example

```vue
<script setup>
import { BaseButton, BaseCard, BaseModal } from '@/components/base';
import { useDisclosure } from '@/composables/useDisclosure';

const { isOpen, open, close } = useDisclosure();
</script>

<template>
  <BaseCard title="Employee details">
    <p>Review this employee's information.</p>
    <template #footer><BaseButton @click="open">View details</BaseButton></template>
  </BaseCard>
  <BaseModal v-model="isOpen" title="Employee details">
    <h2>Employee details</h2>
    <p>Place your dialog content here.</p>
    <template #footer><BaseButton variant="secondary" @click="close">Close</BaseButton></template>
  </BaseModal>
</template>
```

`BaseCard` provides header, default, and footer slots. Use `unstyled` when applying
an existing panel style. `BaseButton` supports primary, secondary, and danger
variants and defaults to `type="button"`. `BaseModal` uses a native dialog for
focus containment, Escape handling, and focus restoration. It supports `v-model`,
default/footer slots, `closeOnBackdrop`, `closeOnEscape`, and a `close` event.
Its required title supplies an accessible name; render a visible heading in the
content when needed. The admin dashboard uses BaseCard; logout uses BaseModal
and BaseButton.

## Verify

Admin user creation sends `POST /createUser` with role ID 2 (manager) or 3
(employee). Manager payloads omit `position_id`. The position select includes
IDs 1–12 with the Khmer names from the supplied positions-table screenshot.
Names returned by users or department position records can update these
labels. Positions are not filtered by department.

The backend requires `GET /getUserById` with a JSON body such as `{"id":2}`.
The browser sends an authenticated `POST /backend-api/getUserById` to the
same-origin bridge, which forwards a **GET with that JSON body** to the backend.
Manager employee details use `GET /my-employee-detail` with `{"employeeId":3}`
through the same bridge (`POST /backend-api/my-employee-detail` in the browser).
Vite development and preview include the bridge. For production, build and run
`npm start` (honors `PORT` and `VITE_API_PROXY_TARGET`), or configure the hosting
server with an equivalent bridge. Static-only hosting cannot send GET bodies.

```sh
npm run build
npm test
```
