import { Line, Group } from 'react-konva';
import { data } from './dxf';
import DfxParser from 'dxf-parser';
// import worker_script from '../../workers/parseText';
// const worker = new Worker(worker_script);
var parser = new DfxParser();
console.log('🛑  parser:', parser);
try {
  const dxfObj = parser.__proto__._parse(data);
  console.log('🛑  dxfObj:', dxfObj);
} catch (e) {
  console.log(e);
}
const DxfDisplay = () => {
  // worker.onmessage = m => console.log('message', m.data);
  // worker.postMessage({ msg: 'getHello', str: data });
  return (
    <>
      <Group>
        <Line points={[1, 1, 50, 50, 20, 60]} stroke="black" />
      </Group>
    </>
  );
};

export default DxfDisplay;
