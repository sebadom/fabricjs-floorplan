import { canvas } from "./canvasManager";
import { fabric } from "fabric";
import { CustomObject } from "./types/CustomObject";
import { calculateArea, calculateTotalArea } from "./utils/area";
import { getRandomRGBA } from "./utils/generics";
import { editPoly, setItextPos, setItextText } from "./utils/polygon";

let snappitThreshold = 30,
  isEditing = false; //pixels to snap

console.log(getRandomRGBA());
const createEmptyRoom = () => {
  var size = 200;

  var rect = new fabric.Polygon(
    [
      { x: 0, y: 0 },
      { x: size, y: 0 },
      { x: size, y: size },
      { x: 0, y: size },
    ],
    {
      left: canvas.width / 2 - size / 2,
      top: canvas.height / 2 - size / 2,
      fill: getRandomRGBA(),
      lockRotation: true,
      strokeWidth: 1,
      stroke: "#999",
      originX: "left",
      originY: "top",
      hasRotatingPoint: false,
      perPixelTargetFind: true,
      objectCaching: false,
      strokeUniform: true,
    }
  ) as CustomObject<fabric.Polygon>;

  var defaultTextOptions = {
    fontSize: 12,
    fontFamily: "Arial, Sans",
    fill: "#D81B60",
    strokeWidth: 0,
    selectable: false,
  };

  var topText = new fabric.IText(
    "top",
    defaultTextOptions
  ) as CustomObject<fabric.IText>;
  topText.set("custom", {
    points: [1, 0],
    topOffset: () => 2,
    leftOffset: () => rect.getScaledWidth() / 2 - topText.width / 2,
    coord: "x",
  });

  var rightText = new fabric.IText(
    "right",
    defaultTextOptions
  ) as CustomObject<fabric.IText>;
  rightText.set("custom", {
    points: [2, 1],
    topOffset: () => rect.getScaledHeight() / 2 - rightText.width / 2,
    leftOffset: () => rect.getScaledWidth() - 2,
    coord: "y",
  });
  rightText.rotate(90);

  var bottomText = new fabric.IText(
    "bottom",
    defaultTextOptions
  ) as CustomObject<fabric.IText>;
  bottomText.set("custom", {
    points: [3, 2],
    topOffset: () => rect.getScaledHeight() - bottomText.height - 2,
    leftOffset: () => rect.getScaledWidth() / 2 - topText.width / 2,
    coord: "x",
  });

  var leftText = new fabric.IText(
    "left",
    defaultTextOptions
  ) as CustomObject<fabric.IText>;
  leftText.set("custom", {
    points: [3, 0],
    topOffset: () => rect.getScaledHeight() / 2 + rightText.width / 2 - 2,
    leftOffset: () => 0 + 2,
    coord: "y",
  });
  leftText.rotate(-90);

  var areaText = new fabric.IText("area", {
    ...defaultTextOptions,
    textAlign: "center",
  }) as CustomObject<fabric.IText>;

  areaText.set("custom", {
    topOffset: () => rect.getScaledHeight() / 2 - areaText.height / 2,
    leftOffset: () => rect.getScaledWidth() / 2 - areaText.width / 2,
    customTextResover: () => `${rect.custom.name}\n${calculateArea(rect)}mt2`,
  });

  delete rect.controls.mtr;

  rect.set("custom", {
    labels: [topText, rightText, bottomText, leftText, areaText],
    name: "New Room",
  });

  rect.custom.labels.forEach((itext) => {
    setItextText(rect, itext);
    setItextPos(rect, itext);
  });

  canvas.add(rect);
  canvas.add(topText);
  canvas.add(rightText);
  canvas.add(bottomText);
  canvas.add(leftText);
  canvas.add(areaText);

  calculateTotalArea();
};

canvas.on("object:moving", function (e) {
  var obj = e.target as CustomObject<fabric.Polygon>;

  if (!isEditing) {
    console.log("moving", obj.custom);

    // snaping
    obj.setCoords(); //Sets corner position coordinates based on current angle, width and height
    canvas.forEachObject(function (targ) {
      // avoid self check or check if it's not a polygon
      if (targ === obj || targ.get("type") !== "polygon") return;

      if (Math.abs(obj.oCoords.tr.x - targ.oCoords.tl.x) < snappitThreshold) {
        obj.left = targ.left - obj.getScaledWidth();
      }
      if (Math.abs(obj.oCoords.tl.x - targ.oCoords.tr.x) < snappitThreshold) {
        obj.left = targ.left + targ.getScaledWidth();
      }
      if (Math.abs(obj.oCoords.br.y - targ.oCoords.tr.y) < snappitThreshold) {
        obj.top = targ.top - obj.getScaledHeight();
      }
      if (Math.abs(targ.oCoords.br.y - obj.oCoords.tr.y) < snappitThreshold) {
        obj.top = targ.top + targ.getScaledHeight();
      }
    });

    // limit
    // top-left  corner
    if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
      obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top);
      obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left);
    }
    // bot-right corner
    if (
      obj.getBoundingRect().top + obj.getBoundingRect().height >
        obj.canvas.height ||
      obj.getBoundingRect().left + obj.getBoundingRect().width >
        obj.canvas.width
    ) {
      obj.top = Math.min(
        obj.top,
        obj.canvas.height -
          obj.getBoundingRect().height +
          obj.top -
          obj.getBoundingRect().top
      );
      obj.left = Math.min(
        obj.left,
        obj.canvas.width -
          obj.getBoundingRect().width +
          obj.left -
          obj.getBoundingRect().left
      );
    }

    // move labels associated with polygon
    obj.custom.labels.forEach((itext) => {
      setItextPos(obj, itext);
      setItextPos(obj, itext);
    });
  }
});

canvas.on("selection:cleared", function (e: any) {
  if (isEditing) {
    editPoly(e.deselected[0], false);
  }
});

canvas.on("selection:updated", function (e: any) {
  if (isEditing) {
    editPoly(e.deselected[0], false);
    editPoly(e.selected[0], true);
  }
});

canvas.on("object:scaling", function (e) {
  var obj = e.target as CustomObject<fabric.Polygon>;

  obj.custom.labels.forEach((itext) => {
    setItextText(obj, itext);
    setItextPos(obj, itext);
  });

  calculateTotalArea();
});

createEmptyRoom();

function edit(doEnable) {
  var poly = canvas.getActiveObject();
  isEditing = doEnable;

  if (poly) {
    console.log("edit");
    editPoly(poly, doEnable);
    canvas.requestRenderAll();
  }
}

document.addEventListener("keydown", (e) => handleCtrl(true, e.code));
document.addEventListener("keyup", (e) => handleCtrl(false, e.code));

function handleCtrl(doEnable, code) {
  if (code === "AltLeft" || code === "AltRight") {
    edit(doEnable);
  }
}
