type ActionButtonsProps = {
  onAnother: () => void;
  onRandom: () => void;
  onDownload: () => void;
};

function ActionButtons({ onAnother, onRandom, onDownload }: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <button className="btn-another" onClick={onAnother}>
        Another
      </button>
      <button className="btn-random" onClick={onRandom}>
        Random
      </button>
      <button className="btn-download" onClick={onDownload}>
        Download
      </button>
    </div>
  );
}

export default ActionButtons;
