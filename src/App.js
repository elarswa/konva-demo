import { Stage, Layer, Rect, Group, Line } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import { flushSnapBoundary, rectPointsToVector } from './collisionUtils';
import kdTree from './KDTree';
// import DxfDisplay from './components/konva/DxfDisplay';
const width = 500;
const height = width;
const rectSize = 50;
const drawGrid = () => {
  const lines = [];
  const spacer = 50;
  let i = spacer;
  while (i < width) {
    lines.push(<Line stroke="black" points={[0, i, width, i]} />); //x
    lines.push(<Line stroke="black" points={[i, 0, i, height]} />);
    i += spacer;
  }
  return lines;
};
const getTwoPointsDistances = (pointA, pointB) => {
  return ((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2) ** 0.5;
};
const tree = new kdTree([], getTwoPointsDistances, ['x', 'y']);

function App() {
  const greyRef = useRef(null);
  const blueRef = useRef(null);
  const greenRef = useRef(null);
  const refs = [greyRef, blueRef, greenRef];

  const updateTreeWithBounds = (
    pos,
    selfRef,
    refs,
    stageWidth,
    stageHeight
  ) => {
    const { width: rectWidth, height: rectHeight } = selfRef.current.attrs;
    const oldRectPoints = rectPointsToVector(selfRef);
    oldRectPoints?.forEach(point => tree.remove(point));
    const rectPoints = rectPointsToVector(selfRef, pos);
    rectPoints?.forEach(point => tree.insert(point));
    console.log('🛑  tree:', tree.count());
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

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {/* <Stage width={window.innerWidth} height={window.innerHeight}> */}
      <Stage width={width} height={height} style={{ backgroundColor: 'white' }}>
        <Layer>{drawGrid()}</Layer>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            stroke="black"
            fillEnabled={false}
          />
          <Group x={10} y={10}>
            {/* <DxfDisplay /> */}
            <Rect
              dragBoundFunc={pos =>
                updateTreeWithBounds(pos, greyRef, refs, width, height)
              }
              ref={greyRef}
              x={50}
              y={100}
              width={rectSize}
              height={rectSize}
              fill="grey"
              stroke="black"
              id={1}
              draggable
            />
            <Rect
              dragBoundFunc={pos =>
                flushSnapBoundary(pos, blueRef, refs, width, height)
              }
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
              dragBoundFunc={pos =>
                flushSnapBoundary(pos, greenRef, refs, width, height)
              }
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
