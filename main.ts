import { Menu, Plugin } from "obsidian";
import { Canvas, CanvasNode, WorkspaceWithCanvas } from "src/@types/types";
import { onNodeScreenshotOption, onSelectionScreenshotOption } from "src/screenshotMenuOption";

/**
 * Plugin to enable canvas node screenshot functionality in Obsidian.
 */
export default class ScreenshotNodePlugin extends Plugin {
	onload(): void {

		const workspace: WorkspaceWithCanvas = this.app.workspace as WorkspaceWithCanvas;

		this.registerEvent(
			workspace.on("canvas:node-menu", (menu: Menu, node: CanvasNode) => {
				onNodeScreenshotOption(menu, node);
			})
		);

		this.registerEvent(
			workspace.on("canvas:selection-menu", (menu: Menu, canvas: Canvas) => {
				onSelectionScreenshotOption(menu, canvas);
			})
		);
	}
}
