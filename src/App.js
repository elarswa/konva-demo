import { Stage, Layer, Rect, Group, Line } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import {
  flushSnapBoundary,
  rectPointsToVector,
  getStageBoundPosition,
  rectangleToKDNode,
  parallelDistance,
  slidingBoundFunc,
  safePointBoundFunc,
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
  const red1Ref = useRef(null);
  const red2Ref = useRef(null);
  const polyGroupRef = useRef(null);
  const refs = [greyRef, blueRef, greenRef, polyGroupRef];
  const [dragStart, setDragStart] = useState({});
  const [safePoints, setSafePoints] = useState([]);

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
  const getSafePoints = () => {
    const offset = 5; //min of 1
    const points = [];
    refs.forEach(ref => {
      if (!ref?.current) return [];
      const box = ref.current.getClientRect(); // x, y, width, height
      const xMin = box.x;
      const yMin = box.y;
      const xMax = box.x + box.width;
      const yMax = box.y + box.height;
      const xMid = (xMax - xMin) / 2 + xMin;
      const yMid = (yMax - yMin) / 2 + yMin;
      // rectangle corners from top left clockwise: a b c d
      points.push({
        point: [xMin - offset, yMin],
        id: ref.current.attrs.id,
        flags: 'a',
      });
      points.push({
        point: [xMin - offset, yMin - offset],
        id: ref.current.attrs.id,
        flags: 'a',
      });
      points.push({
        point: [xMin, yMin - offset],
        id: ref.current.attrs.id,
        flags: 'a',
      });
      points.push({
        point: [xMid, yMin - offset],
        id: ref.current.attrs.id,
        flags: 'ab',
      }); // mid
      points.push({
        point: [xMax, yMin - offset],
        id: ref.current.attrs.id,
        flags: 'b',
      });
      points.push({
        point: [xMax + offset, yMin - offset],
        id: ref.current.attrs.id,
        flags: 'b',
      });
      points.push({
        point: [xMax + offset, yMin],
        id: ref.current.attrs.id,
        flags: 'b',
      });
      points.push({
        point: [xMax + offset, yMid],
        id: ref.current.attrs.id,
        flags: 'bc',
      }); // mid
      points.push({
        point: [xMax + offset, yMax],
        id: ref.current.attrs.id,
        flags: 'c',
      });
      points.push({
        point: [xMax + offset, yMax + offset],
        id: ref.current.attrs.id,
        flags: 'c',
      });
      points.push({
        point: [xMax, yMax + offset],
        id: ref.current.attrs.id,
        flags: 'c',
      });
      points.push({
        point: [xMid, yMax + offset],
        id: ref.current.attrs.id,
        flags: 'cd',
      }); // mid
      points.push({
        point: [xMin, yMax + offset],
        id: ref.current.attrs.id,
        flags: 'd',
      });
      points.push({
        point: [xMin - offset, yMax + offset],
        id: ref.current.attrs.id,
        flags: 'd',
      });
      points.push({
        point: [xMin - offset, yMax],
        id: ref.current.attrs.id,
        flags: 'd',
      });
      points.push({
        point: [xMin - offset, yMid],
        id: ref.current.attrs.id,
        flags: 'da',
      }); //mid
    });
    return points;
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
  const onDragMoveHandler = () => {
    setSafePoints(getSafePoints());
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
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            stroke="black"
            fillEnabled={false}
          />
          <Group>
            {/* <DxfDisplay /> */}
            <Rect
              dragBoundFunc={pos =>
                slidingBoundFunc(
                  pos,
                  greyRef,
                  refs,
                  width,
                  height,
                  stageRef?.current.getPointerPosition()
                )
              }
              onDragMove={onDragMoveHandler}
              ref={greyRef}
              x={50}
              y={100}
              width={rectWidth}
              height={rectHeight}
              fill="grey"
              id={'1'}
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
              id={'2'}
              onDragEnd={onDragEndHandler}
              onDragStart={onDragStartHandler}
              onDragMove={onDragMoveHandler}
              draggable
              onClick={() => clickRect('blue')}
            />
            <Rect
              dragBoundFunc={pos =>
                safePointBoundFunc(
                  pos,
                  greenRef,
                  refs,
                  width,
                  height,
                  stageRef?.current.getPointerPosition(),
                  safePoints
                )
              }
              ref={greenRef}
              x={250}
              y={100}
              width={rectWidth}
              height={rectHeight}
              fill="green"
              id={'3'}
              onDragEnd={onDragEndHandler}
              onDragStart={onDragStartHandler}
              onDragMove={onDragMoveHandler}
              onClick={() => clickRect('green')}
              draggable
            />
          </Group>
          <Group
            x={250}
            y={200}
            ref={polyGroupRef}
            dragBoundFunc={pos =>
              slidingBoundFunc(
                pos,
                polyGroupRef,
                refs,
                width,
                height,
                stageRef?.current.getPointerPosition()
              )
            }
            onDragMove={onDragMoveHandler}
            draggable
            id={'6'}
          >
            <Rect
              // ref={red1Ref}
              x={0}
              y={0}
              width={20}
              height={20}
              fill="red"
              id={'4'}
              onDragEnd={onDragEndHandler}
              onDragStart={onDragStartHandler}
              onClick={() => clickRect('red1')}
            />
            <Rect
              // ref={red2Ref}
              x={40}
              y={30}
              width={20}
              height={20}
              fill="red"
              id={'5'}
              onDragEnd={onDragEndHandler}
              onDragStart={onDragStartHandler}
              onClick={() => clickRect('red2')}
            />
          </Group>
          <Group>
            {safePoints.map(obj => {
              const [x, y] = obj.point;
              return (
                <Rect
                  x={x}
                  y={y}
                  width={2}
                  height={2}
                  offsetX={1}
                  offsetY={1}
                  fill="purple"
                />
              );
            })}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
