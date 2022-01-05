const canvas = new fabric.Canvas("canvas", { preserveObjectStacking: true }),
  canvasWidth = document.getElementById("wrapper").offsetWidth,
  canvasHeight = document.getElementById("wrapper").offsetHeight;

let counter = 0,
  snappitThreshold = 30,
  isEditing = false; //pixels to snap

canvas.selection = false;
canvas.setHeight(canvasHeight);
canvas.setWidth(canvasWidth);

function setItextPos(rect, itext) {
  itext.left = rect.left + itext.custom.leftOffset();
  itext.top = rect.top + itext.custom.topOffset();
}

function getUpdatedPoints(rect) {
  var matrix = rect.calcTransformMatrix();
  return rect
    .get("points")
    .map(function (p) {
      return new fabric.Point(p.x - rect.width / 2, p.y - rect.height / 2);
    })
    .map(function (p) {
      return fabric.util.transformPoint(p, matrix);
    });
}

function setItextText(rect, itext) {
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
}

const createEmptyRoom = (top, left) => {
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
      fill:
        "rgba(" +
        Math.floor(Math.random() * 256) +
        "," +
        Math.floor(Math.random() * 256) +
        "," +
        Math.floor(Math.random() * 256) +
        ", 0.25)",
      // fill: "#f3f3f3",
      lockRotation: true,
      strokeWidth: 1,
      stroke: "#999",
      originX: "left",
      originY: "top",
      // cornerSize: 15,
      hasRotatingPoint: false,
      perPixelTargetFind: true,
      // minScaleLimit: 1,
      maxHeight: canvasHeight,
      maxWidth: canvasWidth,
      objectCaching: false,
      strokeUniform: true,
    }
  );

  var defaultTextOptions = {
    fontSize: 12,
    fontFamily: "Arial, Sans",
    fill: "#D81B60",
    strokeWidth: 0,
    selectable: false,
  };
  var topText = new fabric.IText("top", defaultTextOptions);
  topText.custom = {
    points: [1, 0],
    topOffset: () => 2,
    leftOffset: () => rect.getScaledWidth() / 2 - topText.width / 2,
    coord: "x",
  };

  var rightText = new fabric.IText("right", defaultTextOptions);
  rightText.custom = {
    points: [2, 1],
    topOffset: () => rect.getScaledHeight() / 2 - rightText.width / 2,
    leftOffset: () => rect.getScaledWidth() - 2,
    coord: "y",
  };
  rightText.rotate(90);

  var bottomText = new fabric.IText("bottom", defaultTextOptions);
  bottomText.custom = {
    points: [3, 2],
    topOffset: () => rect.getScaledHeight() - bottomText.height - 2,
    leftOffset: () => rect.getScaledWidth() / 2 - topText.width / 2,
    coord: "x",
  };

  var leftText = new fabric.IText("left", defaultTextOptions);
  leftText.custom = {
    points: [3, 0],
    topOffset: () => rect.getScaledHeight() / 2 + rightText.width / 2 - 2,
    leftOffset: () => 0 + 2,
    coord: "y",
  };
  leftText.rotate(-90);

  var areaText = new fabric.IText("area", {
    ...defaultTextOptions,
    textAlign: "center",
  });

  areaText.custom = {
    topOffset: () => rect.getScaledHeight() / 2 - areaText.height / 2,
    leftOffset: () => rect.getScaledWidth() / 2 - areaText.width / 2,
    customTextResover: () => `${rect.custom.name}\n${calculateArea(rect)}mt2`,
  };

  delete rect.controls.mtr;

  rect.custom = {
    labels: [topText, rightText, bottomText, leftText, areaText],
    name: "New Room",
  };

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
  counter++;

  calculateTotalArea();
};

canvas.on("object:moving", function (e) {
  var obj = e.target;

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

canvas.on("selection:cleared", function (e) {
  if (isEditing) {
    editPoly(e.deselected[0], false);
  }
});

canvas.on("selection:updated", function (e) {
  if (isEditing) {
    editPoly(e.deselected[0], false);
    editPoly(e.selected[0], true);
  }
});

canvas.on("object:scaling", function (e) {
  var obj = e.target;

  // console.log(e);
  obj.custom.labels.forEach((itext) => {
    setItextText(obj, itext);
    setItextPos(obj, itext);
  });

  calculateTotalArea();
});

function calculateTotalArea() {
  var total = canvas.getObjects("polygon").reduce((accum, poly) => {
    accum += calculateArea(poly);
    return accum;
  }, 0);
  document.getElementById("total").innerText = total;
}

function calculateArea(obj) {
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
}

createEmptyRoom();

// define a function that can locate the controls.
// this function will be used both for drawing and for interaction.
function polygonPositionHandler(dim, finalMatrix, fabricObject) {
  var x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
    y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
  return fabric.util.transformPoint(
    { x: x, y: y },
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
        {
          x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
          y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y,
        },
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

const editPoly = (poly, doEnable) => {
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
        pointIndex: index,
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
