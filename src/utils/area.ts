import { canvas } from "../canvasManager";
import { getUpdatedPoints } from "./polygon";

export const calculateTotalArea = () => {
  var total = canvas.getObjects("polygon").reduce((accum, poly) => {
    accum += calculateArea(poly);
    return accum;
  }, 0);
  document.getElementById("total").innerText = String(total);
};

export const calculateArea = (obj) => {
  var total = 0;
  var vertices = getUpdatedPoints(obj);

  for (var i = 0, l = vertices.length; i < l; i++) {
    var addX = vertices[i].x / 100;
    var addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y / 100;
    var subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x / 100;
    var subY = vertices[i].y / 100;

    total += addX * addY * 0.5 - subX * subY * 0.5;
  }

  return Math.round(Math.abs(total) * 100) / 100;
};
