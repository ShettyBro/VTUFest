/**
 * ManualInput.jsx — Fallback text input for QR code entry.
 * Supports typed entry + USB barcode scanner (keyboard mode).
 *
 * Props:
 *   onScan(value)       — called with the trimmed+uppercased value on submit
 *   visible             — show/hide the component
 *   placeholder         — input placeholder text
 *   maxLength           — optional max character count (e.g. 8 for QR codes)
 *   alphanumericOnly    — if true, strips non-alphanumeric chars on input
 */

import { useState, useRef, useEffect } from 'react';

export default function ManualInput({
  onScan,
  visible = true,
  placeholder = 'Enter QR code manually',
  maxLength,
  alphanumericOnly = false,
}) {
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

  const handleChange = (e) => {
    let next = e.target.value;
    if (alphanumericOnly) next = next.replace(/[^a-zA-Z0-9]/g, '');
    if (maxLength) next = next.slice(0, maxLength);
    setValue(next);
    // Auto-submit when the expected length is reached (e.g. USB barcode scanner)
    if (maxLength && next.length === maxLength) {
      const trimmed = next.trim().toUpperCase();
      if (trimmed) {
        onScan(trimmed);
        setValue('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
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
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
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
        {maxLength ? `${value.length}/${maxLength} chars · ` : ''}Type QR code or use USB scanner
      </p>
    </form>
  );
}
