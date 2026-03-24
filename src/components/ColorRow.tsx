import { useState, useEffect } from "react";
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

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value);
  };

  const handleHexBlur = () => {
    if (isValidHex(hexInput)) {
      onChange(index, normalizeHex(hexInput));
    } else {
      setHexInput(color);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = normalizeHex(e.target.value);
    setHexInput(newColor);
    onChange(index, newColor);
  };

  return (
    <div className="color-row">
      <div
        className="color-swatch"
        style={{ backgroundColor: color }}
      />
      <input
        className="color-hex-input"
        type="text"
        value={hexInput}
        onChange={handleHexChange}
        onBlur={handleHexBlur}
      />
      <input
        className="color-picker"
        type="color"
        value={color}
        onChange={handlePickerChange}
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
