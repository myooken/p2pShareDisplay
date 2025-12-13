import { spawn } from 'child_process';
import { PeerServer } from 'peer';

const peerPort = process.env.PEER_PORT || 9000;
const peerPath = process.env.PEER_PATH || '/peerjs';

const peerServer = PeerServer({
  port: Number(peerPort),
  path: peerPath,
});

const vite = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

let closed = false;
const shutdown = () => {
  if (closed) return;
  closed = true;
  peerServer.close();
  if (!vite.killed) {
    vite.kill('SIGTERM');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

vite.on('exit', code => {
  shutdown();
  // eslint-disable-next-line no-process-exit
  process.exit(code === null ? 1 : code);
});
