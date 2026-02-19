interface ChainNavProps {
  onBack: () => void;
  onOriginal: () => void;
  showOriginal: boolean;
}

export function ChainNav({ onBack, onOriginal, showOriginal }: ChainNavProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-card rounded-lg shadow-lg border border-border p-2">
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm text-primary hover:bg-muted rounded-lg"
      >
        &larr; Back
      </button>
      {showOriginal && (
        <button
          onClick={onOriginal}
          className="px-4 py-2 text-sm text-primary hover:bg-muted rounded-lg"
        >
          &uarr; Original
        </button>
      )}
    </div>
  );
}
