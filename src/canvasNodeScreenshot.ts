import { Notice, moment } from "obsidian";
import { Canvas, CanvasNode } from "./@types/types";
import * as HtmlToImage from "html-to-image";

/** Space around the captured nodes, in canvas pixels. */
const PADDING = 5;

/** Largest width or height browsers reliably support for a canvas element. */
const MAX_CANVAS_SIZE = 16384;

/** Classes Obsidian adds to highlight selected nodes, hidden during the capture. */
const HIGHLIGHT_CLASSES = ["is-selected", "is-focused"];

/** An element to capture, and where to draw it, in canvas coordinates. */
type Area = {
    element: HTMLElement;
    x: number;
    y: number;
    width: number;
    height: number;
};

/** An element holding edges, and the edges in it that must not be captured. */
type EdgeLayer = {
    element: HTMLElement;
    hidden: Set<Element>;
    aboveNodes: boolean;
};

/**
 * Check whether a node is a canvas group.
 * @param {CanvasNode} node - The node to check.
 */
export function isGroupNode (node: CanvasNode): boolean {
    return node.getData().type === "group";
}

/**
 * Add the nodes contained in each group, and sort everything in canvas order with groups first,
 * so that groups are drawn behind their content.
 * @param {Canvas} canvas - The canvas the nodes belong to.
 * @param {CanvasNode[]} nodes - The nodes to capture.
 */
function resolveNodes (canvas: Canvas, nodes: CanvasNode[]): CanvasNode[] {

    const selected = new Set(nodes);

    for (const group of nodes.filter(isGroupNode)) {
        for (const node of canvas.nodes.values()) {
            if (
                node.bbox.minX >= group.bbox.minX && node.bbox.maxX <= group.bbox.maxX &&
                node.bbox.minY >= group.bbox.minY && node.bbox.maxY <= group.bbox.maxY
            ) {
                selected.add(node);
            }
        }
    }

    const ordered = Array.from(canvas.nodes.values()).filter((node) => selected.has(node));

    return [...ordered.filter(isGroupNode), ...ordered.filter((node) => !isGroupNode(node))];
}

/**
 * Get the content of a node and its position on the canvas.
 * @param {CanvasNode} node - The node.
 */
function getNodeArea (node: CanvasNode): Area | null {

    const element = node.nodeEl.querySelector<HTMLElement>(".canvas-node-container");

    return element ? { element, x: node.bbox.minX, y: node.bbox.minY, width: node.width, height: node.height } : null;
}

/**
 * Find the elements holding the edges, and hide every edge that does not connect two captured nodes.
 * @param {Canvas} canvas - The canvas the nodes belong to.
 * @param {CanvasNode[]} nodes - The captured nodes.
 */
function getEdgeLayers (canvas: Canvas, nodes: CanvasNode[]): EdgeLayer[] {

    const captured = new Set(nodes);
    const edges = Array.from(canvas.edges.values());
    const connected = edges.filter((edge) => captured.has(edge.from.node) && captured.has(edge.to.node));

    if (connected.length === 0) return [];

    const hidden = new Set<Element>();
    const layers = new Set<HTMLElement>();

    for (const edge of edges) {

        // Without the edge elements, edges cannot be filtered, so none are captured.
        if (!edge.lineGroupEl?.parentElement) return [];

        for (const element of [edge.lineGroupEl, edge.lineEndGroupEl]) {

            if (!element?.parentElement) continue;

            const layer = element.ownerSVGElement ?? element.parentElement;
            layers.add(layer as unknown as HTMLElement);

            if (!connected.includes(edge)) hidden.add(element);
        }
    }

    const firstNode = nodes[0].nodeEl;

    return Array.from(layers).map((element) => ({
        element,
        hidden,
        aboveNodes: Boolean(firstNode.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING),
    }));
}

/**
 * Trigger the download of the screenshot.
 * @param {string} dataURL - Screenshot data URL.
 */
function download (dataURL: string): void {

    const downloaderLink = createEl("a");
    downloaderLink.download = `canvas-node-screenshot-${moment().format("YYYY-MM-DD-HHmmss")}.png`;
    downloaderLink.href = dataURL;
    downloaderLink.click();
}

/**
 * Capture one or more canvas nodes, with the edges between them, into a single PNG image.
 * Groups are captured with the nodes they contain.
 * @param {CanvasNode[]} nodes - The nodes to capture.
 */
export default async function screenshotNodes (nodes: CanvasNode[]): Promise<void> {

    if (nodes.length === 0) return;

    const canvas: Canvas = nodes[0].canvas;
    const capturedNodes = resolveNodes(canvas, nodes);

    const areas = capturedNodes.map(getNodeArea).filter((area): area is Area => area !== null);

    if (areas.length === 0) {
        new Notice("Nothing to capture.");
        return;
    }

    const minX = Math.min(...areas.map((area) => area.x));
    const minY = Math.min(...areas.map((area) => area.y));
    const maxX = Math.max(...areas.map((area) => area.x + area.width));
    const maxY = Math.max(...areas.map((area) => area.y + area.height));

    const width = maxX - minX + PADDING * 2;
    const height = maxY - minY + PADDING * 2;

    // Lower the resolution if the image would be too large for the browser to draw.
    const pixelRatio = Math.min(activeWindow.devicePixelRatio, MAX_CANVAS_SIZE / width, MAX_CANVAS_SIZE / height);

    const backgroundColor = getComputedStyle(activeDocument.body).getPropertyValue("--background-primary").trim();

    // Hide the selection highlight so it does not appear in the screenshot.
    const highlighted: { element: HTMLElement, className: string }[] = [];
    for (const node of capturedNodes) {
        for (const className of HIGHLIGHT_CLASSES) {
            if (node.nodeEl.classList.contains(className)) {
                highlighted.push({ element: node.nodeEl, className });
            }
        }
    }
    highlighted.forEach(({ element, className }) => element.classList.remove(className));

    try {

        const options = { pixelRatio, skipAutoScale: true };

        const edgeLayers = getEdgeLayers(canvas, capturedNodes);
        const edgeCaptures = edgeLayers.map(({ element, hidden }) =>
            HtmlToImage.toCanvas(element, {
                ...options,
                width,
                height,
                style: {
                    transform: `translate(${PADDING - minX}px, ${PADDING - minY}px)`,
                    transformOrigin: "top left",
                },
                filter: (domNode) => !hidden.has(domNode),
            })
        );
        const areaCaptures = areas.map((area) => HtmlToImage.toCanvas(area.element, options));

        const [edgeImages, areaImages] = await Promise.all([Promise.all(edgeCaptures), Promise.all(areaCaptures)]);

        const screenshot = createEl("canvas");
        screenshot.width = Math.round(width * pixelRatio);
        screenshot.height = Math.round(height * pixelRatio);

        const context = screenshot.getContext("2d");

        if (!context) {
            new Notice("Could not create the screenshot image.");
            return;
        }

        context.scale(pixelRatio, pixelRatio);

        if (backgroundColor) {
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, width, height);
        }

        const drawEdges = (aboveNodes: boolean) => edgeImages.forEach((image, index) => {
            if (edgeLayers[index].aboveNodes === aboveNodes) {
                context.drawImage(image, 0, 0, width, height);
            }
        });

        drawEdges(false);

        areaImages.forEach((image, index) => {
            const area = areas[index];
            context.drawImage(image, area.x - minX + PADDING, area.y - minY + PADDING, area.width, area.height);
        });

        drawEdges(true);

        download(screenshot.toDataURL("image/png"));

    } catch (error) {
        console.error("Node Screenshot: capture failed", error);
        new Notice("Screenshot failed. See the developer console for details.");
    } finally {
        highlighted.forEach(({ element, className }) => element.classList.add(className));
    }
}
