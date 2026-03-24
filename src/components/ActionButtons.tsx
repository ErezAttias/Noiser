type ActionButtonsProps = {
  onAnother: () => void;
  onDownload: () => void;
};

function ActionButtons({ onAnother, onDownload }: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <button className="btn-another" onClick={onAnother}>
        Another
      </button>
      <button className="btn-download" onClick={onDownload}>
        Download
      </button>
    </div>
  );
}

export default ActionButtons;
