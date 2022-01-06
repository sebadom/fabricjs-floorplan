import { fabric } from "fabric";

export const canvas = new fabric.Canvas("canvas", {
  preserveObjectStacking: true,
});
export const canvasWidth = document.getElementById("wrapper").offsetWidth;
export const canvasHeight = document.getElementById("wrapper").offsetHeight;

canvas.selection = false;
canvas.setHeight(canvasHeight);
canvas.setWidth(canvasWidth);
