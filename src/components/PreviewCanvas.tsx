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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parsedColors: string[] = JSON.parse(colorsKey);
    renderTexture(ctx, width, height, parsedColors, chaos, grain, seed);
  }, [colorsKey, chaos, grain, seed, width, height]);

  return (
    <div
      className="canvas-preview"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        width={width}
        height={height}
        style={{ maxWidth: "100%" }}
      />
    </div>
  );
}

export default PreviewCanvas;
