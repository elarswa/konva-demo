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
  const { rotation } = ref.current.attrs;
  const box = ref.current.getClientRect();
  return {
    xMin: box.x,
    yMin: box.y,
    xMax: box.x + box.width,
    yMax: box.y + box.height,
    rot: rotation,
    w: box.width,
    h: box.height,
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

export const isPointInPolygon = (polygonArray, point) => {
  let inside = false;
  const [pointX, pointY] = point;
  for (let i = 0; i < polygonArray.length - 1; i++) {
    const p1X = polygonArray[i][0];
    const p1Y = polygonArray[i][1];
    const p2X = polygonArray[i + 1][0];
    const p2Y = polygonArray[i + 1][1];
    // if (p1X === pointX && p1Y === pointY) return true;
    if ((p1Y < pointY && p2Y >= pointY) || (p2Y < pointY && p1Y >= pointY)) {
      // this edge is crossing the horizontal ray of testpoint
      if (p1X + ((pointY - p1Y) / (p2Y - p1Y)) * (p2X - p1X) < pointX) {
        // checking special cases (holes, self-crossings, self-overlapping, horizontal edges, etc.)
        inside = !inside;
      }
    }
  }
  return inside;
};

export const slidingBoundFunc = (
  pos,
  selfRef,
  refs,
  stageWidth,
  stageHeight,
  mousePosition
) => {
  const { id: selfId } = selfRef.current.attrs;
  const self = selfRef.current.getClientRect();
  const allBounds = getAllBoundsWithId(refs);
  const [selfBounds] = allBounds.splice(
    allBounds.findIndex(obj => obj.id === selfId),
    1
  );

  selfBounds.xMin = pos.x;
  selfBounds.yMin = pos.y;
  selfBounds.yMax = pos.y + self.height;
  selfBounds.xMax = pos.x + self.width;
  // prevent entity collision
  const { x, y } = slidingBounds(
    selfBounds,
    allBounds,
    [mousePosition.x, mousePosition.y],
    pos
  );
  // prevent boundary collision
  return getStageBoundPosition({ x, y }, selfRef, stageWidth, stageHeight);
};

export const boundsToPolygon = (bounds, offset = 0) => {
  const { xMin, xMax, yMin, yMax } = bounds;
  return [
    [xMin - offset, yMin - offset],
    [xMax + offset, yMin - offset],
    [xMax + offset, yMax + offset],
    [xMin - offset, yMax + offset],
    [xMin - offset, yMin - offset],
  ];
};

export const slidingBounds = (selfBounds, allBounds, mousePoint, pos) => {
  const selfPoly = boundsToPolygon(selfBounds);
  let collide = false;
  let collideRect = [];
  for (const bound of allBounds) {
    const boundPoly = boundsToPolygon(bound);
    for (const point of boundPoly) {
      if (isPointInPolygon(selfPoly, point)) {
        collide = true;
        collideRect = boundPoly;
        break;
      }
    }
    if (collide) break;
    for (const point of selfPoly) {
      if (isPointInPolygon(boundPoly, point)) {
        collide = true;
        collideRect = boundPoly;
        break;
      }
    }
    if (collide) break;
  }
  if (collide) {
    const possibleEdgePoints = [];
    possibleEdgePoints.push(
      closestPointOnEdge(collideRect[0], collideRect[1], mousePoint) //top
    );
    possibleEdgePoints.push(
      closestPointOnEdge(collideRect[1], collideRect[2], mousePoint) //right
    );
    possibleEdgePoints.push(
      closestPointOnEdge(collideRect[2], collideRect[3], mousePoint) //bottom
    );
    possibleEdgePoints.push(
      closestPointOnEdge(collideRect[3], collideRect[0], mousePoint) //left
    );
    // console.log('🛑  possibleEdgePoints:', possibleEdgePoints);
    const minDist = Math.min(...possibleEdgePoints.map(obj => obj.dist));
    const closestEdgePoint = possibleEdgePoints.find(
      obj => obj.dist === minDist
    ).point;
    // console.log('🛑  closestEdgePoint:', closestEdgePoint);
    const width = selfBounds.xMax - selfBounds.xMin;
    const height = selfBounds.yMax - selfBounds.yMin;
    if (
      closestEdgePoint[0] === possibleEdgePoints[0].point[0] &&
      closestEdgePoint[1] === possibleEdgePoints[0].point[1]
    ) {
      //top
      // console.log('⚠️ top');
      return {
        x: selfBounds.xMin,
        y: collideRect[0][1] - height,
      };
    }
    if (
      closestEdgePoint[0] === possibleEdgePoints[1].point[0] &&
      closestEdgePoint[1] === possibleEdgePoints[1].point[1]
    ) {
      //right
      // console.log('⚠️ right');
      return {
        x: collideRect[1][0],
        y: selfBounds.yMin,
      };
    }
    if (
      closestEdgePoint[0] === possibleEdgePoints[2].point[0] &&
      closestEdgePoint[1] === possibleEdgePoints[2].point[1]
    ) {
      //bottom
      // console.log('⚠️ bottom');
      return {
        x: selfBounds.xMin,
        y: collideRect[2][1],
      };
    }
    if (
      closestEdgePoint[0] === possibleEdgePoints[3].point[0] &&
      closestEdgePoint[1] === possibleEdgePoints[3].point[1]
    ) {
      //left
      // console.log('⚠️ left');
      return {
        x: collideRect[0][0] - width,
        y: selfBounds.yMin,
      };
    }
  }
  return { x: selfBounds.xMin, y: selfBounds.yMin };
};

export const closestPointOnEdge = (edgePoint1, edgePoint2, point) => {
  const [x1, y1] = edgePoint1;
  const [x2, y2] = edgePoint2;
  const [a, b] = point;
  if (x1 === x2) return { point: [x1, b], dist: twoPointDist([x1, b], point) };
  if (y1 === y2) return { point: [a, y1], dist: twoPointDist([a, y1], point) };
  const m1 = (y2 - y1) / (x2 - x1);
  const m2 = -1 / m1;
  const x = (m1 * x1 - m2 * a + b - y1) / (m1 - m2);
  const y = m2 * (x - a) + b;
  return { point: [x, y], dist: twoPointDist([x, y], point) };
};

export const twoPointDist = (point1, point2) => {
  const [x1, y1] = point1;
  const [x2, y2] = point2;
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

export const safePointBoundFunc = (
  pos,
  selfRef,
  refs,
  stageWidth,
  stageHeight,
  mousePosition,
  safePoints
) => {
  const { id: selfId } = selfRef.current.attrs;
  const self = selfRef.current.getClientRect();
  const allBounds = getAllBoundsWithId(refs);
  const [selfBounds] = allBounds.splice(
    allBounds.findIndex(obj => obj.id === selfId),
    1
  );

  selfBounds.xMin = pos.x;
  selfBounds.yMin = pos.y;
  selfBounds.yMax = pos.y + self.height;
  selfBounds.xMax = pos.x + self.width;
  const filterSafePoints = safePoints.filter(obj => obj.id !== selfId);
  // prevent entity collision
  const newPos = safePointBounds(
    selfBounds,
    allBounds,
    [mousePosition.x, mousePosition.y],
    filterSafePoints
  );
  // prevent boundary collision
  return getStageBoundPosition(newPos, selfRef, stageWidth, stageHeight);
};

export const safePointBounds = (
  selfBounds,
  allBounds,
  mousePoint,
  otherSafePoints
) => {
  for (const bound of allBounds) {
    const boundPoly = boundsToPolygon(bound);
    otherSafePoints = otherSafePoints.filter(
      obj => !isPointInPolygon(boundPoly, obj.point)
    );
  }
  const selfPoly = boundsToPolygon(selfBounds);
  let collide = false;
  let collidePoint = [];
  for (const bound of allBounds) {
    const boundPoly = boundsToPolygon(bound);
    for (const point of selfPoly) {
      if (isPointInPolygon(boundPoly, point)) {
        collide = true;
        collidePoint = point; // my point in theirs, use my point
        break;
      }
    }

    if (collide) break;
    for (const point of boundPoly) {
      if (isPointInPolygon(selfPoly, point)) {
        collide = true;
        collidePoint = point; // their point in mine, pick closest actual point on mine to their collide point
        break;
      }
    }
    if (collide) break;
  }
  if (collide) {
    otherSafePoints.forEach(obj => {
      obj.dist = twoPointDist(obj.point, mousePoint);
    });

    const minDist = Math.min(...otherSafePoints.map(obj => obj.dist));
    const bestPoint = otherSafePoints.find(obj => obj.dist === minDist);
    const shiftPoint = pickClosestPoint(selfPoly, collidePoint, bestPoint);
    const shiftDistance = {
      x: bestPoint.point[0] - shiftPoint[0],
      y: bestPoint.point[1] - shiftPoint[1],
    };
    return {
      x: selfBounds.xMin + shiftDistance.x,
      y: selfBounds.yMin + shiftDistance.y,
    };
  }
  return { x: selfBounds.xMin, y: selfBounds.yMin };
};

export const pickClosestPoint = (
  fromPoints = [],
  toPoint,
  bestPoint = { point: [], id: '', flags: '' }
) => {
  const fromWithFlags = [];
  fromWithFlags.push({ point: fromPoints[0], flags: 'a' });
  fromWithFlags.push({ point: fromPoints[1], flags: 'b' });
  fromWithFlags.push({ point: fromPoints[2], flags: 'c' });
  fromWithFlags.push({ point: fromPoints[3], flags: 'd' });
  const validPoints = removeInvalidPoints(fromWithFlags, bestPoint.flags);
  const distArray = [];
  validPoints.forEach(point => {
    distArray.push(twoPointDist(point.point, toPoint));
  });

  const minDist = Math.min(...distArray);
  const bestPointIndex = distArray.indexOf(minDist);
  // console.log('🛑  bestSafePoint:', bestPoint);
  // console.log('🛑  validPoints[bestPointIndex]:', validPoints[bestPointIndex]);
  if (bestPointIndex < 0) return validPoints[0].point;
  return validPoints[bestPointIndex].point;
};

const removeInvalidPoints = (flaggedPoints = [], ignoreFlags = '') => {
  const validIndexes = [];
  // console.log('🛑  ignoreFlags:', ignoreFlags);
  flaggedPoints.forEach((obj, index) => {
    // console.log(
    //   '🛑  !ignoreFlags.includes(obj.flags):',
    //   !ignoreFlags.includes(obj.flags)
    // );
    if (!ignoreFlags.includes(obj.flags)) {
      // console.log(`⚠️ Here ${index}`);
      validIndexes.push(index);
    }
  });
  const validFlaggedPoints = [];
  // console.log('🛑  validIndexes:', validIndexes);
  for (const index of validIndexes) {
    validFlaggedPoints.push(flaggedPoints[index]);
  }
  // console.log('🛑  validFlaggedPoints:', validFlaggedPoints);
  return validFlaggedPoints;
};
