import { EventRef, Menu, Point, View, Workspace } from "obsidian";

import {
	AllCanvasNodeData,
	CanvasEdgeData,
	CanvasData,
	NodeSide,
} from "obsidian/canvas";

export type Canvas = {
	menu: {
		containerEl: HTMLDivElement;
		selection: {
			bbox: CanvasBBox;
		};
		render: () => void;
	};
	nodeInteractionLayer: {
		setTarget: (node: CanvasNode) => void;
		target: null | CanvasNode;
		render: () => void;
	};
	nodes: Map<AllCanvasNodeData["id"], CanvasNode>;
	edges: Map<CanvasEdgeData["id"], CanvasEdge>;
	data: CanvasData;
	view: View;
	pointer: Point;
	requestSave: () => void;
	removeNode: (node: CanvasNode) => void;
	removeEdge: (node: CanvasEdge) => void;
	createTextNode: (args: {
		pos: Point;
		text?: string;
		size?: Size;
		focus?: boolean;
	}) => CanvasNode;
	selection: Set<CanvasNode>;
	edgeTo: Map<CanvasNode, Set<CanvasEdge>>;
	edgeFrom: Map<CanvasNode, Set<CanvasEdge>>;
	[key: string]: unknown;
};

export type CanvasNode = {
	getData: () => AllCanvasNodeData;
	setColor: (color: string) => void;
	setIsEditing: (issEditing: boolean) => void;
	x: number;
	y: number;
	width: number;
	height: number;
	bbox: CanvasBBox;
	nodeEl: HTMLDivElement;
	canvas: Canvas;
	[key: string]: unknown;
};

export type CanvasEdge = {
	getData: () => CanvasEdgeData;
	from: { side: NodeSide; node: CanvasNode; end: NodeSide };
	to: { side: NodeSide; node: CanvasNode; end: NodeSide };
	update: (
		from: { side: NodeSide; node: CanvasNode; end: NodeSide },
		to: { side: NodeSide; node: CanvasNode; end: NodeSide }
	) => void;
	[key: string]: unknown;
};

export type Size = { width: number; height: number };

export type CanvasBBox = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
};

export type WorkspaceWithCanvas = {
	on(
		name: "canvas:creation-menu",
		callback: (menu: Menu, canvas: Canvas, pos: Point, size?: Size) => unknown,
		ctx?: unknown
	): EventRef;
	on(
		name: "canvas:node:initialize",
		callback: (node: CanvasNode) => unknown,
		ctx?: unknown
	): EventRef;
	on(
		name: "canvas:node-menu",
		callback: (menu: Menu, node: CanvasNode) => unknown,
		ctx?: unknown
	): EventRef;
	on(
		name: "canvas:node-connection-drop-menu",
		callback: (menu: Menu, from: CanvasNode, edge: CanvasEdge) => unknown,
		ctx?: unknown
	): EventRef;
	on(
		name: "canvas:edge-menu",
		callback: (menu: Menu, edge: CanvasEdge) => unknown,
		ctx?: unknown
	): EventRef;
	on(
		name: "canvas:selection-menu",
		callback: (menu: Menu, canvas: Canvas) => unknown,
		ctx?: unknown
	): EventRef;
	on(name: "canvas:menu:render", callback: () => unknown, ctx?: unknown): EventRef;
	on(
		name: "canvas:node-interaction-layer:render",
		callback: () => unknown,
		ctx?: unknown
	): EventRef;
	on(
		name: "canvas:node-interaction-layer:set-target",
		callback: (node: CanvasNode) => unknown,
		ctx?: unknown
	): EventRef;
} & Workspace;