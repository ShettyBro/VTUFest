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

// ═══════════════════════════════════════════════════════════════════════════════
// COLLEGE BUDDY
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/volunteer/college-buddy/lookup?qr=XXXX — full participant scan */
export async function collegeBuddyLookup(qr, token) {
  return apiFetch('cb-lookup', `${API_BASE}/api/volunteer/college-buddy/lookup?qr=${encodeURIComponent(qr)}`, {
    headers: authHeader(token),
  });
}

/** GET /api/volunteer/college-buddy/my-college — returns { total_colleges, colleges: [...] } */
export async function collegeBuddyMyColleges(token) {
  return apiFetch('cb-colleges', `${API_BASE}/api/volunteer/college-buddy/my-college`, {
    headers: authHeader(token),
  });
}

/** GET /api/volunteer/college-buddy/my-college/students
 * Note: college_id filter omitted — backend has bigint/number type mismatch.
 * Returns students across all assigned colleges (correct for multi-college buddies).
 */
export async function collegeBuddyStudents(token, _collegeId) {
  return apiFetch('cb-students', `${API_BASE}/api/volunteer/college-buddy/my-college/students`, {
    headers: authHeader(token),
  });
}

/** GET /api/volunteer/college-buddy/my-college/accompanists
 * Note: college_id filter omitted — same type mismatch fix as students.
 */
export async function collegeBuddyAccompanists(token, _collegeId) {
  return apiFetch('cb-accompanists', `${API_BASE}/api/volunteer/college-buddy/my-college/accompanists`, {
    headers: authHeader(token),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALIASES — used by new unified dashboard components
// ═══════════════════════════════════════════════════════════════════════════════

/** RegDesk: scan QR to look up participant (camera or manual QR entry) */
export async function regDeskScan(qr, token) {
  return apiFetch('reg-scan', `${API_BASE}/api/volunteer/registration-desk/find-by-qr?qr=${encodeURIComponent(qr)}`, {
    headers: authHeader(token),
  });
}

/** RegDesk: search by phone number OR USN */
export async function regDeskFindByQuery(query, token) {
  return apiFetch('reg-find-q', `${API_BASE}/api/volunteer/registration-desk/find?q=${encodeURIComponent(query)}`, {
    headers: authHeader(token),
  });
}

/** RegDesk: activate ID card — body: { participant_id, scanned_qr } */
export async function activateId(participantId, scannedQr, token) {
  return apiFetch('reg-activate-id', `${API_BASE}/api/volunteer/registration-desk/activate`, {
    method: 'POST',
    body: JSON.stringify({ participant_id: participantId, scanned_qr: scannedQr }),
    headers: authHeader(token),
  });
}

/** HelpDesk: lookup participant by QR */
export const helpDeskScan = helpDeskLookup;

/** InEvent: scan to mark attendance */
export async function inEventScan(qr, token) {
  return apiFetch('ie-scan', `${API_BASE}/api/volunteer/in-event/scan?qr=${encodeURIComponent(qr)}`, {
    headers: authHeader(token),
  });
}

/** InEvent: fetch my assigned events */
export const getMyEvents = inEventMyEvents;

/** Security: lookup participant by QR */
export const securityScan = securityLookup;

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch the logged-in volunteer's own profile including their QR code.
 * GET /api/volunteer/auth/me
 */
export async function fetchMyQr(token) {
  return apiFetch('vol-me', `${API_BASE}/api/volunteer/auth/me`, {
    headers: authHeader(token),
  });
}
