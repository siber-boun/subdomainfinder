import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import net from 'node:net';
import dns from 'node:dns';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Nmap Top 30 Common Ports
const TOP_30_PORTS = [
  21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 
  1723, 3306, 3389, 5900, 8080, 8443, 161, 5432, 1433, 1521, 2049, 631, 1194, 3000, 9000
];

// Helper function to resolve IP
async function resolveIP(domain: string): Promise<string | null> {
  try {
    const addresses = await dns.promises.resolve4(domain);
    return addresses[0] || null;
  } catch {
    return null;
  }
}

// Local port scanner function
async function localPortScan(host: string): Promise<string> {
  const results: string[] = [];
  const scanPromises = TOP_30_PORTS.map((port) => {
    return new Promise<void>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
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
  if (results.length === 0) return "No open ports found.";
  return results.join('\n');
}

app.get('/api/scan', async (req, res) => {
  const { target } = req.query;
  if (!target || typeof target !== 'string') return res.status(400).json({ error: 'Target is required' });

  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);

  if (isIP) {
    const result = await localPortScan(target);
    res.json({ type: 'portscan', target, result });
  } else {
    try {
      const response = await fetch(`https://crt.sh/?q=${target}&output=json`);
      const data = await response.json();
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
      // Resolve IPs for subdomains (Limited to first 50 for performance)
      const resultsWithIPs = await Promise.all(
        subList.slice(0, 50).map(async (sub) => {
          const ip = await resolveIP(sub);
          return { subdomain: sub, ip };
        })
      );

      res.json({ type: 'subdomains', target, result: resultsWithIPs });
    } catch (error) {
      res.json({ type: 'subdomains', target, result: [] });
    }
  }
});

// Dedicated port scan endpoint
app.get('/api/portscan', async (req, res) => {
  const { ip } = req.query;
  if (!ip || typeof ip !== 'string') return res.status(400).json({ error: 'IP is required' });
  const result = await localPortScan(ip);
  res.json({ result });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
