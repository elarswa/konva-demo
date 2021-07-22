const workercode = () => {
  const parseLines = str => {
    return str.split(/\r\n|\r|\n/g);
  };
  const parseSections = str => {
    const lines = parseLines(str);
    const sections = [];
    let i = 0;
    while (i < lines.length) {
      if (lines[i] === '0') {
        ++i;
        const section = [];
        while (lines[i] !== '0' && lines[i] !== 'EOF') {
          section.push(lines[i]);
          ++i;
        }

        if (section.length) sections.push(section);
      } else {
        ++i;
      }
    }
    return sections;
  };
  const parse = str => {
    return { sections: parseSections(str) };
  };
  onmessage = async event => {
    if (event && event.data && event.data.msg === 'getHello') {
      const { str } = event.data;
      const msg = parse(str);
      postMessage(msg);
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
