/**
 * scannerUtils.js — Pure utility functions for the scanner system.
 * No React dependencies. No state.
 */

// ── Browser Detection ────────────────────────────────────────────────────────
export function isSafari() {
  const ua = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// ── Scan Configuration ──────────────────────────────────────────────────────
export function getScanConfig() {
  const safari = isSafari();
  return {
    fps: safari ? 8 : 12,
    interval: safari ? 125 : 83,      // ms between scans
    resolution: safari
      ? { width: 640, height: 480 }
      : { width: 1280, height: 720 },
    dedupeMs: 2000,                    // ignore same QR for 2s
    roiFraction: 0.6,                  // center 60% crop
  };
}

// ── QR Normalization ────────────────────────────────────────────────────────
export function normalizeQR(raw) {
  if (!raw) return '';
  return raw.toString().trim().toUpperCase();
}

// ── Audio Feedback (Web Audio API — no file dependencies) ───────────────────
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (Safari requires user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Initialize AudioContext on first user gesture (required by Safari).
 * Call this once from a click/tap handler.
 */
export function initAudio() {
  getAudioContext();
}

/**
 * Play a tone.
 * @param {'success' | 'error' | 'scan'} type
 */
export function playBeep(type = 'success') {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'success':
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.15);
        break;
      case 'error':
        oscillator.type = 'square';
        oscillator.frequency.value = 220;
        gain.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'scan':
        oscillator.type = 'sine';
        oscillator.frequency.value = 1200;
        gain.gain.value = 0.08;
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.08);
        break;
      default:
        oscillator.type = 'sine';
        oscillator.frequency.value = 660;
        gain.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.12);
    }
  } catch {
    // Audio not available — silent fallback
  }
}

// ── Visual Flash ────────────────────────────────────────────────────────────
/**
 * Returns the CSS class name for a flash overlay.
 * @param {'success' | 'error' | 'warning' | 'info'} type
 */
export function getFlashClass(type) {
  switch (type) {
    case 'success': return 'vol-flash-success';
    case 'error': return 'vol-flash-error';
    case 'warning': return 'vol-flash-warning';
    default: return '';
  }
}

// ── Error Classification ────────────────────────────────────────────────────
/**
 * Classify an API response into a standardized error type.
 */
export function classifyError(status, data) {
  if (status === 200 || status === 201) return { type: 'SUCCESS', message: data?.message || 'Success' };
  if (status === 400) return { type: 'INVALID_INPUT', message: data?.message || 'Invalid input' };
  if (status === 401) return { type: 'AUTH_EXPIRED', message: 'Session expired. Please login again.' };
  if (status === 403) return { type: 'FORBIDDEN', message: data?.message || 'Access denied' };
  if (status === 404) return { type: 'NOT_FOUND', message: data?.message || 'QR code not found' };
  if (status === 409) return { type: 'ALREADY_DONE', message: data?.message || 'Already processed' };
  if (status === 429) return { type: 'COOLDOWN', message: data?.message || 'Please wait before scanning again' };
  return { type: 'SERVER_ERROR', message: data?.message || 'Server error. Please try again.' };
}
