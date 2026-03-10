import type { VercelRequest, VercelResponse } from '@vercel/node';
import net from 'node:net';

const TOP_30_PORTS = [
  21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 
  1723, 3306, 3389, 5900, 8080, 8443, 161, 5432, 1433, 1521, 2049, 631, 1194, 3000, 9000
];

async function localPortScan(host: string): Promise<string> {
  const results: string[] = [];
  const scanPromises = TOP_30_PORTS.map((port) => {
    return new Promise<void>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.on('connect', () => {
        results.push(`${host}:${port} [OPEN]`);
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => { socket.destroy(); resolve(); });
      socket.on('error', () => { socket.destroy(); resolve(); });
      socket.connect(port, host);
    });
  });
  await Promise.all(scanPromises);
  return results.length === 0 ? "No open ports found." : results.join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ip } = req.query;
  if (!ip || typeof ip !== 'string') return res.status(400).json({ error: 'IP is required' });
  const result = await localPortScan(ip);
  return res.json({ result });
}
