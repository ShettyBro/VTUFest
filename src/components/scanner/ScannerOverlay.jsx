/**
 * ScannerOverlay.jsx — Visual overlay rendered on top of the camera video feed.
 * Shows scan region indicator, animated scan line, and flash feedback.
 */

import { useEffect, useState } from 'react';

export default function ScannerOverlay({ flash, cameraStatus, scanCount }) {
  const [flashActive, setFlashActive] = useState('');

  useEffect(() => {
    if (flash) {
      setFlashActive(flash);
      const t = setTimeout(() => setFlashActive(''), 400);
      return () => clearTimeout(t);
    }
  }, [flash]);

  return (
    <div className="vol-scanner-overlay">
      {/* Flash overlay */}
      {flashActive && <div className={`vol-flash vol-flash-${flashActive}`} />}

      {/* Scan region frame */}
      <div className="vol-scan-region">
        <div className="vol-scan-corner vol-scan-tl" />
        <div className="vol-scan-corner vol-scan-tr" />
        <div className="vol-scan-corner vol-scan-bl" />
        <div className="vol-scan-corner vol-scan-br" />
        <div className="vol-scan-line" />
      </div>

      {/* Camera status badge */}
      {cameraStatus !== 'active' && (
        <div className="vol-camera-status">
          {cameraStatus === 'requesting' && '📷 Requesting camera...'}
          {cameraStatus === 'denied' && '🚫 Camera blocked'}
          {cameraStatus === 'error' && '⚠️ Camera error'}
          {cameraStatus === 'restarting' && '🔄 Restarting camera...'}
          {cameraStatus === 'idle' && '📷 Tap Start to scan'}
        </div>
      )}

      {/* Scan count badge */}
      {typeof scanCount === 'number' && scanCount > 0 && (
        <div className="vol-scan-count">
          Scanned: {scanCount}
        </div>
      )}
    </div>
  );
}
