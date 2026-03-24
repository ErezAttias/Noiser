type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function SliderControl({ label, value, min, max, step, onChange }: SliderControlProps) {
  return (
    <div className="slider-control">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export default SliderControl;
