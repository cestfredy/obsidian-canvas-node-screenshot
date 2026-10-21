import { Menu } from "obsidian";
import { Canvas, CanvasNode } from "./@types/types";
import screenshotNodes, { isGroupNode } from "./canvasNodeScreenshot";

/**
 * Add the screenshot option on the menu of a node.
 * @param {Menu} menu - Where we will add option.
 * @param {CanvasNode} node - Current node.
 */
export function onNodeScreenshotOption (menu: Menu, node: CanvasNode): void {

    menu.addSeparator();

    menu.addItem((item) => {
        item
            .setTitle(isGroupNode(node) ? "Capture group screenshot" : "Capture node screenshot")
            .setIcon("scissors-square-dashed-bottom")
            .onClick(async () => {
                await screenshotNodes([node]);
            });
    });
}

/**
 * Add the screenshot option on the menu of a selection of nodes.
 * @param {Menu} menu - Where we will add option.
 * @param {Canvas} canvas - Canvas holding the selection.
 */
export function onSelectionScreenshotOption (menu: Menu, canvas: Canvas): void {

    if (canvas.selection.size === 0) return;

    menu.addSeparator();

    menu.addItem((item) => {
        item
            .setTitle("Capture selection screenshot")
            .setIcon("scissors-square-dashed-bottom")
            .onClick(async () => {
                await screenshotNodes(Array.from(canvas.selection));
            });
    });
}
