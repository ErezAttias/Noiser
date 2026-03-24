import { useState, useRef, useCallback } from "react";
import type { AppState } from "../lib/types";
import { parseStateFromParams } from "../lib/urlState";

type Props = {
  onImport: (state: Partial<AppState>) => void;
};

export default function ImportUrlBox({ onImport }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(""), 3000);
  }, []);

  const handleImport = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    let params: URLSearchParams;
    try {
      const url = new URL(trimmed);
      params = url.searchParams;
    } catch {
      try {
        params = new URLSearchParams(trimmed);
      } catch {
        showError("No valid parameters found");
        return;
      }
    }

    const parsed = parseStateFromParams(params);
    if (Object.keys(parsed).length === 0) {
      showError("No valid parameters found");
      return;
    }

    onImport(parsed);
    setInputValue("");
    setError("");
  };

  return (
    <div className="import-section">
      <button
        className="import-toggle"
        onClick={() => setExpanded((e) => !e)}
      >
        Import from URL
      </button>
      {expanded && (
        <>
          <div className="import-row">
            <input
              className="import-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste URL or query params..."
            />
            <button className="import-btn" onClick={handleImport}>
              Import
            </button>
          </div>
          {error && <div className="import-error">{error}</div>}
        </>
      )}
    </div>
  );
}
