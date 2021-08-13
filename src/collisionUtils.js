import { SAT, Polygon, Vector } from './SAT';
export const flushSnapBoundary = (
  pos,
  selfRef,
  refs,
  stageWidth,
  stageHeight
) => {
  const {
    width: rectWidth,
    height: rectHeight,
    id: selfId,
  } = selfRef.current.attrs;
  const allBounds = getAllBoundsWithId(refs);
  const [selfBounds] = allBounds.splice(
    allBounds.findIndex(obj => obj.id === selfId),
    1
  );
  selfBounds.xMin = pos.x;
  selfBounds.yMin = pos.y;
  selfBounds.yMax = pos.y + rectHeight;
  selfBounds.xMax = pos.x + rectWidth;
  // prevent entity collision
  const { x, y } = getBoundedPos(selfBounds, allBounds);
  // prevent boundary collision
  return getStageBoundPosition({ x, y }, selfRef, stageWidth, stageHeight);
};

export const getStageBoundPosition = (
  pos,
  selfRef,
  stageWidth,
  stageHeight
) => {
  const { width: rectWidth, height: rectHeight } = selfRef.current.attrs;
  const { x, y } = pos;
  const newX =
    x < 0 ? 0 : x > stageWidth - rectWidth ? stageWidth - rectWidth : x;
  const newY =
    y < 0 ? 0 : y > stageHeight - rectHeight ? stageHeight - rectHeight : y;

  return {
    x: newX,
    y: newY,
  };
};

//take in a react ref
const getRectBoundRef = ref => {
  if (!ref) return;
  const { width: w, height: h, rotation } = ref.current.attrs;
  const { x, y } = ref.current.absolutePosition();
  return {
    xMin: x,
    yMin: y,
    xMax: x + w,
    yMax: y + h,
    rot: rotation,
    w: w,
    h: h,
  };
};

//take in the event target
const getRectBound = target => {
  if (!target) return;
  const { width: w, height: h, rotation } = target.attrs;
  const { x, y } = target.absolutePosition();
  return {
    xMin: x,
    yMin: y,
    xMax: x + w,
    yMax: y + h,
    rot: rotation,
    w: w,
    h: h,
  };
};

export const getAllBoundsWithId = arr => {
  const res = [];
  arr.forEach(ref => {
    const bounds = getRectBoundRef(ref);
    res.push({ ...bounds, id: ref.current.attrs.id });
  });
  return res;
};

const isBetween = (val, lower, upper) => {
  return val >= lower && val <= upper;
};
const getClosest = (val, lower, upper) => {
  return Math.abs(lower - val) < Math.abs(upper - val) ? lower : upper;
};

const getBoundedPos = (myPoints, theirPoints) => {
  const { xMin, xMax, yMin, yMax, w, h } = myPoints;
  let finalX = xMin;
  let finalY = yMin;
  for (let i = 0; i < theirPoints.length; i++) {
    const left = isBetween(xMin, theirPoints[i].xMin, theirPoints[i].xMax);
    const right = isBetween(xMax, theirPoints[i].xMin, theirPoints[i].xMax);
    const top = isBetween(yMin, theirPoints[i].yMin, theirPoints[i].yMax);
    const bot = isBetween(yMax, theirPoints[i].yMin, theirPoints[i].yMax);
    if ((left || right) && (top || bot)) {
      if (left) {
        const closest = getClosest(
          xMin,
          theirPoints[i].xMin,
          theirPoints[i].xMax
        );
        if (xMin === closest) finalX = closest - w;
        else finalX = closest;
      } else if (right) {
        const closest = getClosest(
          xMax,
          theirPoints[i].xMin,
          theirPoints[i].xMax
        );
        if (xMax === closest) finalX = xMax;
        else finalX = closest - w;
      }

      if (top) {
        const closest = getClosest(
          yMin,
          theirPoints[i].yMin,
          theirPoints[i].yMax
        );
        if (yMin === closest) finalY = yMin - h;
        else finalY = closest;
      } else if (bot) {
        const closest = getClosest(
          yMax,
          theirPoints[i].yMin,
          theirPoints[i].yMax
        );
        if (yMax === closest) finalY = yMax;
        else finalY = closest - h;
      }
    }
  }

  return {
    x: finalX,
    y: finalY,
  };
};

export const satCollide = (pos, selfRef, refs, stageWidth, stageHeight) => {};

// assumes rotating about origin
export const rotatePoint = (point, degrees) => {
  const rad = (degrees * Math.PI) / 180;
  const [x, y] = point;
  return [
    x * Math.cos(rad) - y * Math.sin(rad),
    x * Math.sin(rad) + y * Math.cos(rad),
  ];
};

// handles rotation shifted from origin
export const rotateTransform = (point, about, degrees) => {
  const [x, y] = point;
  const [aboutX, aboutY] = about;
  const shiftToOrigin = [x - aboutX, y - aboutY];
  const [rX, rY] = rotatePoint(shiftToOrigin, degrees);
  return [rX + aboutX, rY + aboutY];
};

// use with event.target or react ref
export const rectPointsToVector = (target, currentPos) => {
  if (!target) return null;
  const {
    width,
    height,
    rotation = 0,
    id,
    x: refx,
    y: refy,
  } = target?.current?.attrs || target?.attrs || null;
  const x = currentPos?.x;
  const y = currentPos?.y;
  //   if (!width || !height || !refx || !refy) return null;
  const [point2x, point2y] = rotateTransform(
    [(x ?? refx) + width, y ?? refy],
    [x ?? refx, y ?? refy],
    rotation
  );
  const [point3x, point3y] = rotateTransform(
    [x ?? refx, (y ?? refy) + height],
    [x ?? refx, y ?? refy],
    rotation
  );
  const [point4x, point4y] = rotateTransform(
    [(x ?? refx) + width, (y ?? refy) + height],
    [x ?? refx, y ?? refy],
    rotation
  );
  return [
    { x: x ?? refx, y: y ?? refy, id },
    { x: point2x, y: point2y, id },
    { x: point3x, y: point3y, id },
    { x: point4x, y: point4y, id },
  ];
};

// returns single kd node data with x and y at the rectangle center point
export const rectangleToKDNode = (target, currentPos) => {
  if (!target) return null;
  const {
    width,
    height,
    rotation = 0,
    id,
    x: refx,
    y: refy,
  } = target?.current?.attrs || target?.attrs || null;
  const x = currentPos?.x;
  const y = currentPos?.y;
  const centerX = ((x ?? refx) + (x ?? refx) + width) / 2;
  const centerY = ((y ?? refy) + (y ?? refy) + height) / 2;
  const [finalX, finalY] = rotateTransform(
    [centerX, centerY],
    [x ?? refx, y ?? refy],
    rotation
  );
  return [{ x: finalX, y: finalY, id, rotation, width, height }];
};

// pointArr has two points to denote a line with { x: ..., y: ...}
export const parallelDistance = (pointArr1, pointArr2) => {
  const a1 = pointArr1[1].y - pointArr1[0].y;
  const b1 = pointArr1[0].x - pointArr1[1].x;
  let c1 = a1 * pointArr1[0].x + b1 * pointArr1[0].y;

  const a2 = pointArr2[1].y - pointArr2[0].y;
  const b2 = pointArr2[0].x - pointArr2[1].x;
  let c2 = a2 * pointArr2[0].x + b2 * pointArr2[0].y;

  const determinant = a1 * b2 - a2 * b1;
  if (determinant === 0) {
    // solve for distance
    if (a1 < a2) {
      c2 = a2 / a1;
    } else if (a1 > a2) {
      c1 = a1 / a2;
    }
    return Math.abs((c2 - c1) / (a1 ** 2 + b1 ** 2) ** 0.5);
  } else {
    console.log('lines are not parallel');
    return null;
  }
};
