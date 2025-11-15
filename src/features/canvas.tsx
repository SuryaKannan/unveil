import { useRef } from "react";
import { ReactInfiniteCanvas, type ReactInfiniteCanvasHandle } from "react-infinite-canvas";
import { FitButton } from "../components/FitButton";
import { ComponentSelector } from "../components/ComponentSelector";

export const InfiniteCanvas = () => {
  const canvasRef = useRef<ReactInfiniteCanvasHandle>(null);
  return (
    <div style={{ 
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }}>
    <ReactInfiniteCanvas
        ref={canvasRef}
        onCanvasMount={(mountFunc: ReactInfiniteCanvasHandle) => {
          mountFunc.fitContentToView({ scale: 1 });
        }}
        customComponents={[
          {
            component: <FitButton canvasRef={canvasRef} />,
            offset: { x: 30, y: 30 }
          }
        ]}
    >
        <div></div>
    </ReactInfiniteCanvas>
    
    <div style={{
      position: "absolute",
      top: 20,
      left: 10,
      bottom: 20,
      width: "250px",
      zIndex: 1000,
      pointerEvents: "none"
    }}>
      <ComponentSelector />
    </div>

    </div>
  );
};
