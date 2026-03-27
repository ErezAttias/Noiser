import { useState, useEffect, useRef } from "react";
import { isValidHex, normalizeHex } from "../lib/color";

type ColorRowProps = {
  color: string;
  index: number;
  onChange: (index: number, color: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
};

function ColorRow({ color, index, onChange, onRemove, canRemove }: ColorRowProps) {
  const [hexInput, setHexInput] = useState(color);
  // Local swatch color for immediate visual feedback during debounced picking
  const [localColor, setLocalColor] = useState(color);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingColorRef = useRef<string | null>(null);
  // Stable refs so the debounce callback always uses current props
  const onChangeRef = useRef(onChange);
  const indexRef = useRef(index);
  onChangeRef.current = onChange;
  indexRef.current = index;

  useEffect(() => {
    setHexInput(color);
    setLocalColor(color);
  }, [color]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value);
  };

  const handleHexBlur = () => {
    // Flush any pending picker debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (isValidHex(hexInput)) {
      const normalized = normalizeHex(hexInput);
      setLocalColor(normalized);
      onChange(index, normalized);
    } else {
      setHexInput(color);
      setLocalColor(color);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = normalizeHex(e.target.value);
    // Immediate local feedback (swatch + hex text) — no rerender cost
    setHexInput(newColor);
    setLocalColor(newColor);
    pendingColorRef.current = newColor;

    // Debounce the expensive parent state update that triggers canvas re-render.
    // On iPhone the native color picker fires onChange at ~60fps; each parent
    // update triggers a full-canvas renderTexture() at 3× DPR which freezes
    // the main thread. 120ms keeps the preview responsive without perceptible lag.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      if (pendingColorRef.current) {
        onChangeRef.current(indexRef.current, pendingColorRef.current);
        pendingColorRef.current = null;
      }
    }, 120);
  };

  return (
    <div className="color-row">
      <div className="color-picker-wrap">
        <div
          className="color-swatch"
          style={{ backgroundColor: localColor }}
        />
        <input
          className="color-picker"
          type="color"
          value={localColor}
          onChange={handlePickerChange}
        />
      </div>
      <input
        className="color-hex-input"
        type="text"
        value={hexInput}
        onChange={handleHexChange}
        onBlur={handleHexBlur}
      />
      <button
        className="color-remove-btn"
        disabled={!canRemove}
        onClick={() => onRemove(index)}
        aria-label="Remove color"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
        </svg>
      </button>
    </div>
  );
}

export default ColorRow;
