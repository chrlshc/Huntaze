// Simulate receiving a deep link in dev without installer
import './main';

const idx = process.argv.findIndex(a => a === '--url');
if (idx > -1 && process.argv[idx + 1]) {
  // Push the URL into argv so main.ts picks it up via parseInitialArgv
  process.argv.push(process.argv[idx + 1]);
}

