import { type ReactInfiniteCanvasHandle } from "react-infinite-canvas";
import { Maximize2 } from "lucide-react";

export const FitButton = ({ canvasRef }: { canvasRef: React.RefObject<ReactInfiniteCanvasHandle | null> }) => (
  <button 
    onClick={() => canvasRef.current?.fitContentToView({ scale: 1 })}
    style={{ padding: "8px", cursor: "pointer" }}
  >
    <Maximize2 size={30} />
  </button>
);
