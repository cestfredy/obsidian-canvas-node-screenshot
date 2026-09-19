import { moment } from "obsidian";
import { CanvasNode } from "./@types/types";
import * as HtmlToImage from "html-to-image";

/**
 * Capture and download a screenshot of a canvas node.
 * @param {CanvasNode} node - The current node.
 */
export default async function screenshotNodeElement (node: CanvasNode) {

    const workspace: HTMLElement | null = document.querySelector("body");
    const currentNodeElement: HTMLElement | null = node.nodeEl.querySelector(".canvas-node-container");
    const canvasBackgroundColor: string = workspace?.classList.contains("theme-light") ? "#ffffff" : "#1e1e1e";

    if (currentNodeElement) {
        
        try {

            const nodeDataURL: string = await HtmlToImage.toPng(currentNodeElement);

            /**
             * Create a screenshot downloader from dataURL.
             * @param {string} dataURL - Node screenshot data URL.
             */
            const downloadIt = (dataURL: string): void => {
                
                const downloaderLink = document.createElement("a");
                downloaderLink.download = `canvas-node-screenshot-${moment().format("YYYY-MM-DD-HHmmss")}.png`;
                downloaderLink.href = dataURL;
                downloaderLink.click();
            }
            
            const screenshot = new Image();
            screenshot.src = nodeDataURL;

            screenshot.onload = () => {

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                const width = screenshot.width + 10;
                const height = screenshot.height + 10;

                canvas.width = width;
                canvas.height = height;

                if (context) {
                    
                    context.fillStyle = canvasBackgroundColor;
                    context.fillRect(0, 0, width, height);

                    const x = (width - screenshot.width) / 2;
                    const y = (height - screenshot.height) / 2;

                    context.drawImage(screenshot, x, y);

                    const screenshotDataURL = canvas.toDataURL();
                    downloadIt(screenshotDataURL);

                } else {
                    console.error("Canvas Context not found !");
                }
                
            }
            
        } catch (error) {
            console.error("Error capturing screenshot: ", error);
        }

    } else {
        console.error("Node Element not found !");
    }  
    
}