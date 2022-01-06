import { fabric } from "fabric";
import { CustomObject } from "../types/CustomObject";
import { calculateTotalArea } from "./area";

export const getUpdatedPoints = (rect: fabric.Polygon) => {
  var matrix = rect.calcTransformMatrix();
  return rect
    .get("points")
    .map(function (p) {
      return new fabric.Point(p.x - rect.width / 2, p.y - rect.height / 2);
    })
    .map(function (p) {
      return fabric.util.transformPoint(p, matrix);
    });
};

export const setItextPos = (
  rect: CustomObject<fabric.Polygon>,
  itext: CustomObject<fabric.IText>
) => {
  itext.left = rect.left + itext.custom.leftOffset();
  itext.top = rect.top + itext.custom.topOffset();
};

export const setItextText = (
  rect: CustomObject<fabric.Polygon>,
  itext: CustomObject<fabric.IText>
) => {
  if (itext.custom.customTextResover) {
    itext.set("text", itext.custom.customTextResover());
  } else {
    var transformedPoints = getUpdatedPoints(rect);

    itext.set(
      "text",
      `${
        Math.round(
          Math.abs(
            (transformedPoints[itext.custom.points[0]][itext.custom.coord] -
              transformedPoints[itext.custom.points[1]][itext.custom.coord]) /
              100
          ) * 100
        ) / 100
      }mts.`
    );
  }
};

// define a function that can locate the controls.
// this function will be used both for drawing and for interaction.
function polygonPositionHandler(dim, finalMatrix, fabricObject) {
  var x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
    y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
  return fabric.util.transformPoint(
    new fabric.Point(x, y),
    fabric.util.multiplyTransformMatrices(
      fabricObject.canvas.viewportTransform,
      fabricObject.calcTransformMatrix()
    )
  );
}

// define a function that will define what the control does
// this function will be called on every mouse move after a control has been
// clicked and is being dragged.
// The function receive as argument the mouse event, the current trasnform object
// and the current position in canvas coordinate
// transform.target is a reference to the current object being transformed,
function actionHandler(eventData, transform, x, y) {
  var polygon = transform.target,
    currentControl = polygon.controls[polygon.__corner],
    mouseLocalPosition = polygon.toLocalPoint(
      new fabric.Point(x, y),
      "center",
      "center"
    ),
    polygonBaseSize = polygon._getNonTransformedDimensions(),
    size = polygon._getTransformedDimensions(0, 0),
    finalPointPosition = {
      x:
        (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
        polygon.pathOffset.x,
      y:
        (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
        polygon.pathOffset.y,
    };
  polygon.points[currentControl.pointIndex] = finalPointPosition;

  transform.target.custom.labels.forEach((itext) => {
    setItextPos(transform.target, itext);
    setItextText(transform.target, itext);
  });

  calculateTotalArea();

  return true;
}

// define a function that can keep the polygon in the same position when we change its
// width/height/top/left.
function anchorWrapper(anchorIndex, fn) {
  return function (eventData, transform, x, y) {
    var fabricObject = transform.target,
      absolutePoint = fabric.util.transformPoint(
        new fabric.Point(
          fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
          fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y
        ),
        fabricObject.calcTransformMatrix()
      ),
      actionPerformed = fn(eventData, transform, x, y),
      newDim = fabricObject._setPositionDimensions({}),
      polygonBaseSize = fabricObject._getNonTransformedDimensions(),
      newX =
        (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
        polygonBaseSize.x,
      newY =
        (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
        polygonBaseSize.y;
    fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
    return actionPerformed;
  };
}

export const editPoly = (poly, doEnable) => {
  poly.edit = doEnable;
  poly.lockMovementX = doEnable;
  poly.lockMovementY = doEnable;

  if (poly.edit) {
    var lastControl = poly.points.length - 1;
    poly.cornerStyle = "circle";
    poly.cornerColor = "rgba(0,0,255,0.5)";
    poly.controls = poly.points.reduce(function (acc, point, index) {
      acc["p" + index] = new fabric.Control({
        positionHandler: polygonPositionHandler,
        actionHandler: anchorWrapper(
          index > 0 ? index - 1 : lastControl,
          actionHandler
        ),
        actionName: "modifyPolygon",
      });
      return acc;
    }, {});
  } else {
    poly.cornerColor = "blue";
    poly.cornerStyle = "rect";
    poly.controls = fabric.Object.prototype.controls;
  }
  poly.hasBorders = !poly.edit;
};
