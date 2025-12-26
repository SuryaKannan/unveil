import { useEffect } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { canvasClient } from "./client/canvasClient";

let lastSend = 0;

export default function App() {
	useEffect(() => {
		canvasClient.onCanvasState((canvas) => console.log("Canvas: ", canvas));
		canvasClient.onConnectionChange((connected) =>
			console.log("Connected:", connected),
		);
		canvasClient.connect("ws://localhost:8080/canvas");
		return () => {
			canvasClient.disconnect();
		};
	}, []);

	const THROTTLE_MS = 50;

	const handleMouseMove = (e: React.MouseEvent) => {
		const now = Date.now();
		if (now - lastSend < THROTTLE_MS) return;
		lastSend = now;

		canvasClient.sendCursorUpdate(e.clientX, e.clientY);
	};

	return (
		<div style={{ position: "fixed", inset: 0 }} onMouseMove={handleMouseMove}>
			<Tldraw />
		</div>
	);
}
