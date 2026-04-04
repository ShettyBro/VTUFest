/**
 * ManualInput.jsx — Fallback text input for QR code entry.
 * Supports typed entry + USB barcode scanner (keyboard mode).
 */

import { useState, useRef, useEffect } from 'react';

export default function ManualInput({ onScan, visible = true, placeholder = 'Enter QR code manually' }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  // Auto-focus when visible
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    onScan(trimmed);
    setValue('');
    // Re-focus for rapid sequential scanning
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!visible) return null;

  return (
    <form className="vol-manual-input" onSubmit={handleSubmit}>
      <div className="vol-manual-input-row">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="vol-manual-input-field"
        />
        <button type="submit" className="vol-manual-input-btn" disabled={!value.trim()}>
          Scan
        </button>
      </div>
      <p className="vol-manual-input-hint">
        Type QR code or use USB scanner
      </p>
    </form>
  );
}
