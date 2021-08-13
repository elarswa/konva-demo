const workercode = () => {
  const myRand = (a, b, m, seed = 1) => {
    const x1 = (a * seed + b) % m;
    const u1 = x1 / m;
    return [u1, x1];
  };

  const adj = ['good', 'bad', 'ugly', 'pretty', 'hot', 'bland', 'dumb', 'fat'];

  onmessage = async event => {
    if (event && event.data && event.data.msg === 'echo') {
      const { str } = event.data;

      postMessage(`Someone clicked the ${str} rectangle!`);
      setTimeout(() => {
        const [val] = myRand(12, 1, 20, new Date().getMilliseconds());
        const randIndex = Math.floor(val * adj.length);
        postMessage(`⚠️ ${str} is a ${adj[randIndex]} color`);
      }, 2000);
      postMessage('Thinking...');
    } else {
      postMessage('default message');
    }
  };
};
let code = workercode.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));

const blob = new Blob([code], { type: 'application/javascript' });
const worker_script = URL.createObjectURL(blob);

module.exports = worker_script;
