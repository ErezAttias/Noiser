import { FORMATS, FORMAT_KEYS } from "../lib/constants";
import type { FormatKey } from "../lib/constants";

type FormatSelectorProps = {
  value: FormatKey;
  onChange: (format: FormatKey) => void;
};

function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="format-selector">
      <div className="format-label">Format</div>
      <div className="format-chips">
        {FORMAT_KEYS.map((key) => {
          const f = FORMATS[key];
          return (
            <button
              key={key}
              className={`format-chip${key === value ? " format-chip--active" : ""}`}
              onClick={() => onChange(key)}
            >
              <span className="format-chip-label">{f.label}</span>
              <span className="format-chip-res">{f.width}&times;{f.height}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FormatSelector;
