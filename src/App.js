import { Stage, Layer, Rect, Group, Line } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import {
  flushSnapBoundary,
  rectPointsToVector,
  getStageBoundPosition,
  rectangleToKDNode,
  parallelDistance,
  altBoundFunc,
} from './collisionUtils';
import kdTree from './KDTree';
import worker_script from './workers/worker.worker';
const worker = new Worker(worker_script);
// import DxfDisplay from './components/konva/DxfDisplay';
const width = 500;
const height = width;
const rectWidth = 50;
const rectHeight = 70;
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
  const stageRef = useRef(null);
  const greyRef = useRef(null);
  const blueRef = useRef(null);
  const greenRef = useRef(null);
  const refs = [greyRef, blueRef, greenRef];
  const [dragStart, setDragStart] = useState({});

  const onDragEndHandler = e => {
    //remove old points
    rectangleToKDNode(e.target, dragStart)?.forEach(point =>
      tree.remove(point)
    );
    // add new position points
    rectangleToKDNode(e.target, e.target._lastPos)?.forEach(point =>
      tree.insert(point)
    );
    // console.log('🛑  kd points count:', tree.count());
    // console.log('🛑  balanceFactor:', tree.balanceFactor());

    // console.log(
    //   '🛑  tree.nearest',
    //   tree
    //     .nearest(e.target._lastPos, 2)
    //     .filter(([meta, distance]) => meta.id !== e.target.attrs.id)?.[0]?.[0]
    //     ?.id
    // );
    const nearestRef = refs.find(
      ref =>
        ref.current.attrs.id ===
        tree
          .nearest(e.target._lastPos, 2)
          .filter(([meta, distance]) => meta.id !== e.target.attrs.id)?.[0]?.[0]
          ?.id
    );
    const nearestPoints = rectPointsToVector(nearestRef);
    const selfPoints = rectPointsToVector(e.target, e.target._lastPos);
    if (nearestPoints && selfPoints) {
      const nearTop = [nearestPoints[0], nearestPoints[1]];
      const nearLeft = [nearestPoints[0], nearestPoints[2]];
      const nearRight = [nearestPoints[1], nearestPoints[3]];
      const nearBot = [nearestPoints[2], nearestPoints[3]];

      const selfTop = [selfPoints[0], selfPoints[1]];
      const selfLeft = [selfPoints[0], selfPoints[2]];
      const selfRight = [selfPoints[1], selfPoints[3]];
      const selfBot = [selfPoints[2], selfPoints[3]];

      const distances = [];
      distances.push(parallelDistance(nearTop, selfBot));
      distances.push(parallelDistance(nearLeft, selfRight));
      distances.push(parallelDistance(nearRight, selfLeft));
      distances.push(parallelDistance(nearBot, selfTop));
      // console.log('🛑  distances:', distances);
      // console.log('🛑  Math.min(distances):', Math.min(...distances));
    }
  };

  const onDragStartHandler = e => {
    setDragStart(e.target.absolutePosition());
  };

  const clickRect = who => {
    // worker.postMessage({ msg: 'echo', str: who });
    // const rectPoints = rectPointsToVector(greyRef);
    // console.log('🛑  rectPoints:', rectPoints);
    // const dist = parallelDistance(
    //   [rectPoints[0], rectPoints[1]],
    //   [rectPoints[2], rectPoints[3]]
    // );
    // console.log('🛑  dist:', dist);
  };

  worker.onmessage = m => console.log('Worker says:', m.data);
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {/* <Stage width={window.innerWidth} height={window.innerHeight}> */}
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        style={{ backgroundColor: 'white' }}
      >
        <Layer>{drawGrid()}</Layer>
        <Layer>
          <Line
            points={[50, 50, 150, 50]}
            stroke={'blue'}
            strokeWidth={3}
            rotation={10}
          />
        </Layer>
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
                altBoundFunc(
                  pos,
                  greyRef,
                  refs,
                  width,
                  height,
                  stageRef?.current.getPointerPosition()
                )
              }
              ref={greyRef}
              x={50}
              y={100}
              width={rectWidth}
              height={rectHeight}
              fill="grey"
              stroke="black"
              id={1}
              onDragEnd={onDragEndHandler}
              onDragStart={onDragStartHandler}
              draggable
              onClick={() => clickRect('grey')}
            />
            <Rect
              dragBoundFunc={pos =>
                flushSnapBoundary(pos, blueRef, refs, width, height)
              }
              ref={blueRef}
              x={150}
              y={100}
              width={rectWidth}
              height={rectHeight + 40}
              fill="blue"
              stroke="black"
              id={2}
              onDragEnd={onDragEndHandler}
              onDragStart={onDragStartHandler}
              draggable
              onClick={() => clickRect('blue')}
            />
            <Rect
              dragBoundFunc={pos =>
                flushSnapBoundary(pos, greenRef, refs, width, height)
              }
              ref={greenRef}
              x={250}
              y={100}
              width={rectWidth}
              height={rectHeight}
              fill="green"
              stroke="black"
              id={3}
              onDragEnd={onDragEndHandler}
              onDragStart={onDragStartHandler}
              onClick={() => clickRect('green')}
              draggable
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
