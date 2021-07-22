import { Stage, Layer, Rect, Group } from 'react-konva';
import { useRef } from 'react';
// import DxfDisplay from './components/konva/DxfDisplay';
const width = 500;
const height = 500;
const rectSize = 50;

const getRectBound = ref => {
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

const getAllBoundsWithId = arr => {
  const res = [];
  arr.forEach(ref => {
    const bounds = getRectBound(ref);
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
        if (xMin === closest) finalX = xMin - w;
        else finalX = closest;
      }
      if (right) {
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
      }
      if (bot) {
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

function App() {
  const redRef = useRef(null);
  const blueRef = useRef(null);
  const greenRef = useRef(null);
  const refs = [redRef, blueRef, greenRef];

  const rectBoundFunc = (pos, selfRef) => {
    const selfId = selfRef.current.attrs.id;
    const allBounds = getAllBoundsWithId(refs);
    const [selfBounds] = allBounds.splice(
      allBounds.findIndex(obj => obj.id === selfId),
      1
    );
    selfBounds.xMin = pos.x;
    selfBounds.yMin = pos.y;
    selfBounds.yMax = pos.y + selfRef.current.attrs.height;
    selfBounds.xMax = pos.x + selfRef.current.attrs.width;
    const { x, y } = getBoundedPos(selfBounds, allBounds);
    const newX = x < 0 ? 0 : x > width - rectSize ? width - rectSize : x;
    const newY = y < 0 ? 0 : y > height - rectSize ? height - rectSize : y;

    return {
      x: newX,
      y: newY,
    };
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {/* <Stage width={window.innerWidth} height={window.innerHeight}> */}
      <Stage width={width} height={height} style={{ backgroundColor: 'white' }}>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            stroke="black"
            fillEnabled={false}
            // draggable
          />
          <Group x={10} y={10}>
            {/* <DxfDisplay /> */}
            <Rect
              dragBoundFunc={pos => rectBoundFunc(pos, redRef)}
              ref={redRef}
              x={50}
              y={100}
              width={rectSize}
              height={rectSize}
              fill="red"
              stroke="black"
              id={1}
              draggable
            />
            <Rect
              dragBoundFunc={pos => rectBoundFunc(pos, blueRef)}
              ref={blueRef}
              x={150}
              y={100}
              width={rectSize}
              height={rectSize}
              fill="blue"
              stroke="black"
              id={2}
              draggable
            />
            <Rect
              dragBoundFunc={pos => rectBoundFunc(pos, greenRef)}
              ref={greenRef}
              x={250}
              y={100}
              width={rectSize}
              height={rectSize}
              fill="green"
              stroke="black"
              id={3}
              draggable
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
