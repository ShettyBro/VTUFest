/**
 * volunteerApi.js — Centralized API service for all volunteer scanner operations.
 * 
 * Every function:
 *   - Uses AbortController to cancel previous in-flight requests
 *   - Returns { ok, status, data } tuple
 *   - Never throws — errors are always returned as { ok: false, ... }
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.vtufest2026.acharyahabba.com';

// ── Active controller tracking (per-function key) ───────────────────────────
const controllers = {};

function abortPrevious(key) {
  if (controllers[key]) {
    controllers[key].abort();
  }
  controllers[key] = new AbortController();
  return controllers[key];
}

async function apiFetch(key, url, options = {}) {
  const controller = abortPrevious(key);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, data: { message: 'Request cancelled' }, aborted: true };
    }
    return { ok: false, status: 0, data: { message: 'Network error — unable to reach server.' } };
  }
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Volunteer login (all roles except food).
 * POST /api/volunteer/auth/login
 */
export async function volunteerLogin(email, password, role) {
  return apiFetch('vol-login', `${API_BASE}/api/volunteer/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, role }),
  });
}

/**
 * Food volunteer login.
 * POST /api/food/auth/login
 */
export async function foodLogin(email, password) {
  return apiFetch('food-login', `${API_BASE}/api/food/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION DESK
// ═══════════════════════════════════════════════════════════════════════════════

export async function regDeskFind(phone, token) {
  return apiFetch('reg-find', `${API_BASE}/api/volunteer/registration-desk/find?phone=${encodeURIComponent(phone)}`, {
    headers: authHeader(token),
  });
}

export async function regDeskActivate(participantId, scannedQr, token) {
  return apiFetch('reg-activate', `${API_BASE}/api/volunteer/registration-desk/activate`, {
    method: 'POST',
    body: JSON.stringify({ participant_id: participantId, scanned_qr: scannedQr }),
    headers: authHeader(token),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELP DESK
// ═══════════════════════════════════════════════════════════════════════════════

export async function helpDeskLookup(qr, token) {
  return apiFetch('help-lookup', `${API_BASE}/api/volunteer/help-desk/lookup?qr=${encodeURIComponent(qr)}`, {
    headers: authHeader(token),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-EVENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function inEventMyEvents(token) {
  return apiFetch('ie-events', `${API_BASE}/api/volunteer/in-event/my-events`, {
    headers: authHeader(token),
  });
}

export async function inEventLookup(qr, token) {
  return apiFetch('ie-lookup', `${API_BASE}/api/volunteer/in-event/lookup?qr=${encodeURIComponent(qr)}`, {
    headers: authHeader(token),
  });
}

export async function inEventMarkPresent(qrCode, eventName, token) {
  return apiFetch('ie-mark', `${API_BASE}/api/volunteer/in-event/mark-present`, {
    method: 'POST',
    body: JSON.stringify({ qr_code: qrCode, event_name: eventName }),
    headers: authHeader(token),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

export async function securityLookup(qr, token) {
  return apiFetch('sec-lookup', `${API_BASE}/api/volunteer/general/lookup?qr=${encodeURIComponent(qr)}`, {
    headers: authHeader(token),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOD
// ═══════════════════════════════════════════════════════════════════════════════

export async function foodMyStall(token) {
  return apiFetch('food-stall', `${API_BASE}/api/food/auth/my-stall`, {
    headers: authHeader(token),
  });
}

export async function foodScan(qrCode, stallId, token, overrideReason, mealType) {
  const body = { qr_code: qrCode };
  if (stallId) body.stall_id = stallId;
  if (overrideReason) body.override_reason = overrideReason;
  if (mealType) body.meal_type = mealType;

  return apiFetch('food-scan', `${API_BASE}/api/food/scan`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: authHeader(token),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAS URL HELPER
// ═══════════════════════════════════════════════════════════════════════════════

export async function getSASUrl(blobUrl, token) {
  return apiFetch('sas', `${API_BASE}/api/volunteer/sas`, {
    method: 'POST',
    body: JSON.stringify({ blob_url: blobUrl }),
    headers: authHeader(token),
  });
}
