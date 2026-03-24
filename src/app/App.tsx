import { useEffect, useRef, useState } from "react";
import "./App.css";
import { DEFAULT_COLORS, DEFAULT_CHAOS, DEFAULT_GRAIN } from "../lib/constants";
import { exportPng } from "../lib/exportPng";
import { generateSeed } from "../lib/random";
import type { AppState } from "../lib/types";
import { parseStateFromUrl, createDebouncedUrlSync } from "../lib/urlState";
import ColorList from "../components/ColorList";
import PreviewCanvas from "../components/PreviewCanvas";
import SliderControl from "../components/SliderControl";
import ActionButtons from "../components/ActionButtons";
import ImportUrlBox from "../components/ImportUrlBox";

function App() {
  const [state, setState] = useState<AppState>(() => {
    const defaults: AppState = {
      colors: DEFAULT_COLORS,
      chaos: DEFAULT_CHAOS,
      grain: DEFAULT_GRAIN,
      seed: generateSeed(),
    };
    const urlState = parseStateFromUrl();
    return { ...defaults, ...urlState };
  });

  const debouncedSync = useRef(createDebouncedUrlSync(300)).current;

  useEffect(() => {
    debouncedSync(state);
  }, [state, debouncedSync]);

  const handleColorsChange = (colors: string[]) => {
    setState((prev) => ({ ...prev, colors }));
  };

  const handleAnother = () => {
    setState((prev) => ({ ...prev, seed: generateSeed() }));
  };

  const handleDownload = () => {
    exportPng(state.colors, state.chaos, state.grain, state.seed);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.code === "Space" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        setState((prev) => ({ ...prev, seed: generateSeed() }));
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="app">
      <PreviewCanvas
        colors={state.colors}
        chaos={state.chaos}
        grain={state.grain}
        seed={state.seed}
      />
      <div className="controls">
        <h1 className="app-title">Noiser</h1>
        <ColorList colors={state.colors} onChange={handleColorsChange} />
        <SliderControl
          label="Chaos"
          value={state.chaos}
          min={0}
          max={1}
          step={0.01}
          onChange={(chaos) => setState((prev) => ({ ...prev, chaos }))}
        />
        <SliderControl
          label="Grain"
          value={state.grain}
          min={0}
          max={1}
          step={0.01}
          onChange={(grain) => setState((prev) => ({ ...prev, grain }))}
        />
        <ActionButtons onAnother={handleAnother} onDownload={handleDownload} />
        <ImportUrlBox onImport={(imported) => setState((prev) => ({ ...prev, ...imported }))} />
        <div className="seed-display">Seed: {state.seed}</div>
        <div className="keyboard-hint">Press <kbd>Space</kbd> to regenerate</div>
      </div>
    </div>
  );
}

export default App;
