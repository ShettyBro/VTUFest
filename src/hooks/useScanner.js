/**
 * useScanner.js — React hook for camera-based QR scanning.
 *
 * Uses @zxing/browser. Keeps ALL performance-critical state in refs.
 * Only 2 useState calls (cameraStatus, scannerReady) — minimal re-renders.
 *
 * Safari-safe: lower resolution, slower interval, explicit start button fallback.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { getScanConfig, normalizeQR, isSafari, isIOS } from '../utils/scannerUtils';

/**
 * @param {Object} options
 * @param {(qr: string) => void} options.onScan — called when a NEW QR is decoded
 * @param {boolean} options.enabled — controls whether the scan loop is active
 * @param {number} [options.dedupeMs] — ignore same QR within this window (default from config)
 * @returns {{ videoRef, cameraStatus, scannerReady, startCamera, stopCamera, restartCamera }}
 */
export default function useScanner({ onScan, enabled = true, dedupeMs }) {
  const config = getScanConfig();
  const effectiveDedupeMs = dedupeMs ?? config.dedupeMs;

  // ── Refs (never trigger re-render) ──────────────────────────────────────
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readerRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const lastScanRef = useRef({ value: '', timestamp: 0 });
  const watchdogRef = useRef(null);
  const onScanRef = useRef(onScan);
  const enabledRef = useRef(enabled);
  const retryCountRef = useRef(0);

  // ── State (minimal — only for UI display) ──────────────────────────────
  const [cameraStatus, setCameraStatus] = useState('idle');
  // 'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'restarting'
  const [scannerReady, setScannerReady] = useState(false);

  // Keep refs in sync
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // ── Create offscreen canvas once ────────────────────────────────────────
  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
    readerRef.current = new BrowserQRCodeReader();
    return () => {
      readerRef.current = null;
    };
  }, []);

  // ── Scan loop ──────────────────────────────────────────────────────────
  const startScanLoop = useCallback(() => {
    if (intervalRef.current) return; // already running

    intervalRef.current = setInterval(() => {
      if (!enabledRef.current) return;
      if (!videoRef.current || !canvasRef.current || !readerRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2) return; // not enough data

      const canvas = canvasRef.current;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      // ROI: center crop
      const roi = config.roiFraction;
      const cropW = Math.floor(vw * roi);
      const cropH = Math.floor(vh * roi);
      const cropX = Math.floor((vw - cropW) / 2);
      const cropY = Math.floor((vh - cropH) / 2);

      canvas.width = cropW;
      canvas.height = cropH;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      try {
        const luminanceSource = readerRef.current.createLuminanceSource(canvas);
        const binaryBitmap = readerRef.current.createBinaryBitmap(luminanceSource);
        const result = readerRef.current.decodeBitmap(binaryBitmap);

        if (result) {
          const qr = normalizeQR(result.getText());
          if (!qr) return;

          // Deduplicate
          const now = Date.now();
          const last = lastScanRef.current;
          if (last.value === qr && (now - last.timestamp) < effectiveDedupeMs) {
            return; // same QR within dedup window
          }

          lastScanRef.current = { value: qr, timestamp: now };
          onScanRef.current?.(qr);
        }
      } catch {
        // No QR found in this frame — normal, continue
      }
    }, config.interval);
  }, [config.interval, config.roiFraction, effectiveDedupeMs]);

  const stopScanLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Camera lifecycle ──────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    stopScanLoop();
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerReady(false);
  }, [stopScanLoop]);

  const startCamera = useCallback(async () => {
    setCameraStatus('requesting');
    retryCountRef.current = 0;

    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: config.resolution.width },
        height: { ideal: config.resolution.height },
      },
      audio: false,
    };

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback: try simpler constraints (Safari compat)
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;

        await videoRef.current.play();
      }

      setCameraStatus('active');
      setScannerReady(true);
      startScanLoop();

      // ── Watchdog: detect black screen / stream drop ──────────────────
      watchdogRef.current = setInterval(() => {
        if (!videoRef.current) return;
        const v = videoRef.current;
        if (v.videoWidth === 0 || v.readyState < 2) {
          // Stream may have died
          if (retryCountRef.current < 3) {
            retryCountRef.current++;
            setCameraStatus('restarting');
            stopCamera();
            setTimeout(() => startCamera(), 1000);
          } else {
            setCameraStatus('error');
            stopCamera();
          }
        }
      }, 5000);

    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else if (err.name === 'NotFoundError') {
        setCameraStatus('error');
      } else {
        setCameraStatus('error');
      }
    }
  }, [config.resolution.width, config.resolution.height, startScanLoop, stopCamera]);

  const restartCamera = useCallback(() => {
    retryCountRef.current = 0;
    stopCamera();
    setTimeout(() => startCamera(), 500);
  }, [stopCamera, startCamera]);

  // ── Pause/resume scan loop based on `enabled` prop ──────────────────
  useEffect(() => {
    if (enabled && cameraStatus === 'active') {
      startScanLoop();
    } else {
      stopScanLoop();
    }
  }, [enabled, cameraStatus, startScanLoop, stopScanLoop]);

  // ── Cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    cameraStatus,
    scannerReady,
    startCamera,
    stopCamera,
    restartCamera,
    isSafariBrowser: isSafari(),
    isIOSDevice: isIOS(),
  };
}
