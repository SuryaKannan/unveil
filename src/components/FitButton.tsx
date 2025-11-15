import { type ReactInfiniteCanvasHandle } from "react-infinite-canvas";
import { Maximize2 } from "lucide-react";
import { useState } from "react";

export const FitButton = ({ canvasRef }: { canvasRef: React.RefObject<ReactInfiniteCanvasHandle | null> }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    canvasRef.current?.fitContentToView({ scale: 1 });
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
  };

  return (
    <button 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        padding: "8px", 
        cursor: "pointer", 
        border: "1px solid rgba(129, 134, 144, 1)",
        outline: "none",
        backgroundColor: isHovered ? "rgba(147, 112, 219, 0.3)" : "rgba(26, 26, 26, 1)",
        boxShadow: isClicked 
          ? "0 0 20px rgba(147, 112, 219, 0.8)"
          : isHovered 
          ? "0 0 10px rgba(147, 112, 219, 0.8)"
          : "none",
        transition: "all 0.2s ease",
        borderRadius: "15px",
      }}
    >
      <Maximize2 size={30} color={isHovered || isClicked ? "#9370DB" : "#fff"} />
    </button>
  );
};
