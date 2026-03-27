import { useEffect, useRef } from "react";
import { CANVAS_PREVIEW_WIDTH, CANVAS_PREVIEW_HEIGHT } from "../lib/constants";
import { renderTexture } from "../lib/renderTexture";

type PreviewCanvasProps = {
  colors: string[];
  chaos: number;
  grain: number;
  seed: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
};

function PreviewCanvas({
  colors,
  chaos,
  grain,
  seed,
  width = CANVAS_PREVIEW_WIDTH,
  height = CANVAS_PREVIEW_HEIGHT,
  aspectRatio,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Serialise colors so the dependency check works with array references.
  const colorsKey = JSON.stringify(colors);

  useEffect(() => {
    // Defer rendering to the next animation frame so rapid state changes
    // (e.g. dragging a color picker or slider) coalesce into a single render.
    // Each new effect run cancels the previous pending frame, so only the
    // latest state is rendered — preventing the main thread from being
    // blocked by a backlog of expensive renderTexture() calls.
    const raf = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const physicalWidth = Math.round(width * dpr);
      const physicalHeight = Math.round(height * dpr);

      // Size the canvas bitmap to match physical display pixels.
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Disable image smoothing so putImageData pixels stay crisp.
      ctx.imageSmoothingEnabled = false;

      const parsedColors: string[] = JSON.parse(colorsKey);
      renderTexture(ctx, physicalWidth, physicalHeight, parsedColors, chaos, grain, seed);
    });

    return () => cancelAnimationFrame(raf);
  }, [colorsKey, chaos, grain, seed, width, height]);

  return (
    <div
      className="canvas-preview"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <canvas
        ref={canvasRef}
        className="preview-canvas"
      />
    </div>
  );
}

export default PreviewCanvas;
