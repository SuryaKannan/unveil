import type { Canvas, OutboundMessage } from "../types/canvasTypes";

interface CanvasClient {
	connect(url: string): void;
	disconnect(): void;
	sendCursorUpdate(x: number, y: number): void;
	sendTextElementUpdate(x: number, y: number, text: string): void;
	onCanvasState(callback: (canvas: Canvas) => void): void;
	onConnectionChange(callback: (connected: boolean) => void): void;
}

class CanvasClientImpl implements CanvasClient {
	private ws: WebSocket | null = null;
	private stateCallbacks: ((canvas: Canvas) => void)[] = [];
	private connectionCallbacks: ((connected: boolean) => void)[] = [];

	connect(url: string): void {
		this.ws = new WebSocket(url);

		this.ws.onopen = () => {
			for (const cb of this.connectionCallbacks) {
				cb(true);
			}
		};

		this.ws.onclose = () => {
			for (const cb of this.connectionCallbacks) {
				cb(false);
			}
		};

		this.ws.onerror = (error) => {
			console.error("Websocket error:", error);
		};

		this.ws.onmessage = (event) => {
			const canvas: Canvas = JSON.parse(event.data);
			for (const cb of this.stateCallbacks) {
				cb(canvas);
			}
		};
	}

	disconnect(): void {
		this.ws?.close();
		this.ws = null;
	}

	sendCursorUpdate(x: number, y: number): void {
		this.send({ type: "CURSOR_UPDATE", x, y });
	}

	sendTextElementUpdate(x: number, y: number, text: string): void {
		this.send({ type: "TEXT_ELEMENT_UPDATE", x, y, text });
	}

	onCanvasState(callback: (canvas: Canvas) => void): void {
		this.stateCallbacks.push(callback);
	}

	onConnectionChange(callback: (connected: boolean) => void): void {
		this.connectionCallbacks.push(callback);
	}

	private send(message: OutboundMessage): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}
}

export const canvasClient = new CanvasClientImpl();
