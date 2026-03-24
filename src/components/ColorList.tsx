import ColorRow from "./ColorRow";
import { MIN_COLORS, MAX_COLORS } from "../lib/constants";

type ColorListProps = {
  colors: string[];
  onChange: (colors: string[]) => void;
};

function ColorList({ colors, onChange }: ColorListProps) {
  const handleColorChange = (index: number, color: string) => {
    const next = [...colors];
    next[index] = color;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...colors, "#888888"]);
  };

  const canRemove = colors.length > MIN_COLORS;

  return (
    <div className="color-list">
      <h3>Colors</h3>
      {colors.map((color, index) => (
        <ColorRow
          key={index}
          color={color}
          index={index}
          onChange={handleColorChange}
          onRemove={handleRemove}
          canRemove={canRemove}
        />
      ))}
      <button
        className="add-color-btn"
        disabled={colors.length >= MAX_COLORS}
        onClick={handleAdd}
      >
        Add Color
      </button>
    </div>
  );
}

export default ColorList;
