import net from 'node:net';

const host = '8.8.8.8';
const port = 53;

console.log(`Testing connection to ${host}:${port}...`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
  console.log('SUCCESS: Connected!');
  socket.destroy();
});

socket.on('timeout', () => {
  console.log('TIMEOUT: Could not connect.');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('ERROR:', err.message);
  socket.destroy();
});

socket.connect(port, host);
