import { Button } from "@/components/ui/button";

export default function ActionButtons({ onAddRow, onClearAllRows }) {
  return (
    <div className="flex gap-3">
      <Button
        onClick={onAddRow}
      >
        Add Line
      </Button>

      <Button variant="outline" 
      onClick={onClearAllRows}>
        Clear All Lines
      </Button>
    </div>
  );
}