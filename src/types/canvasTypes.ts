export interface Cursor {
	userId: string;
	x: number;
	y: number;
}

export interface TextElement {
	id: string;
	userId: string;
	text: string;
	x: number;
	y: number;
}

export interface Canvas {
	cursors: Record<string, Cursor>;
	textElements: TextElement[];
}

interface CursorUpdateMessage {
	type: "CURSOR_UPDATE";
	x: number;
	y: number;
}

interface TextElementUpdateMessage {
	type: "TEXT_ELEMENT_UPDATE";
	x: number;
	y: number;
	text: string;
}

export type OutboundMessage = CursorUpdateMessage | TextElementUpdateMessage;
