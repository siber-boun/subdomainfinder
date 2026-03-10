import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import dns from 'node:dns';
import net from 'node:net';

// Nmap Top 30 Common Ports
const TOP_30_PORTS = [
  21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 
  1723, 3306, 3389, 5900, 8080, 8443, 161, 5432, 1433, 1521, 2049, 631, 1194, 3000, 9000
];

async function resolveIP(domain: string): Promise<string | null> {
  try {
    const addresses = await dns.promises.resolve4(domain);
    return addresses[0] || null;
  } catch {
    return null;
  }
}

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
  const { target } = req.query;
  if (!target || typeof target !== 'string') return res.status(400).json({ error: 'Target is required' });

  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);

  if (isIP) {
    const result = await localPortScan(target);
    return res.json({ type: 'portscan', target, result });
  } else {
    try {
      const response = await fetch(`https://crt.sh/?q=${target}&output=json`);
      const data: any = await response.json();
      const subSet = new Set<string>();
      data.forEach((entry: any) => {
        entry.name_value.split('\n').forEach((name: string) => {
          const cleaned = name.trim().toLowerCase();
          if (cleaned.endsWith(target)) {
            subSet.add(cleaned.startsWith('*.') ? cleaned.substring(2) : cleaned);
          }
        });
      });

      const subList = Array.from(subSet).sort();
      const resultsWithIPs = await Promise.all(
        subList.slice(0, 30).map(async (sub) => {
          const ip = await resolveIP(sub);
          return { subdomain: sub, ip };
        })
      );

      return res.json({ type: 'subdomains', target, result: resultsWithIPs });
    } catch (error) {
      return res.json({ type: 'subdomains', target, result: [] });
    }
  }
}
