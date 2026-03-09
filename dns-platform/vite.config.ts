import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'node:dns'
import net from 'node:net'
import https from 'node:https'
import http from 'node:http'

const HTTP_HTTPS_PORTS = [
  80, 8080, 8000, 8008, 8888, 8081, 8082, 8083, 8084, 8090,
  443, 8443, 8444, 9443, 4443,
  3000, 3001, 4000, 5000, 9000, 9090, 9200, 7080, 7443
];

const checkPort = (port: number, host: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1500); // Fast timeout for port check
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            resolve(false);
        });
        
        socket.connect(port, host);
    });
};

const checkHttp = (protocol: string, host: string, port: number): Promise<{status: number | string, isCloudflare: boolean, protocolUsed: string}> => {
    return new Promise((resolve, reject) => {
        const lib = protocol === 'https:' ? https : http;
        const requestObj = lib.request(`${protocol}//${host}:${port}`, {
            method: 'HEAD',
            timeout: 2000,
            rejectUnauthorized: false
        }, (response) => {
            const serverHeader = (response.headers['server'] || '').toLowerCase();
            const isCloudflare = serverHeader.includes('cloudflare');
            resolve({ status: response.statusCode || 'Bilinmiyor', isCloudflare, protocolUsed: protocol });
        });
        requestObj.on('error', reject);
        requestObj.on('timeout', () => { 
            requestObj.destroy(); 
            reject(new Error('timeout')); 
        });
        requestObj.end();
    });
};

const analyzerPlugin = () => ({
  name: 'domain-analyzer',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/api/analyze?domain=')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const domain = url.searchParams.get('domain');
        
        if (!domain) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Domain is required' }));
        }

        let ip = null;
        try {
          const records = await dns.promises.resolve4(domain);
          if (records && records.length > 0) ip = records[0];
        } catch (e) {
          // DNS resolve failed
        }

        const activePorts: { port: number, status: number | string, isCloudflare: boolean, protocol: string }[] = [];

        if (ip) {
            // Check all ports concurrently
            const portChecks = HTTP_HTTPS_PORTS.map(async (port) => {
                const isOpen = await checkPort(port, domain);
                if (isOpen) {
                    let status: number | string = 'Açık (Yanıt Yok)';
                    let isCloudflare = false;
                    let finalProtocol = 'http:';
                    // Determine protocol based on common HTTPS ports
                    const isHttps = [443, 8443, 8444, 9443, 4443, 7443].includes(port);
                    
                    try {
                        const result = await checkHttp(isHttps ? 'https:' : 'http:', domain, port);
                        status = result.status;
                        isCloudflare = result.isCloudflare;
                        finalProtocol = result.protocolUsed;
                    } catch (e) {
                        // If HTTPS fails on an assumed HTTPS port, try HTTP
                        if (isHttps) {
                            try {
                                const result = await checkHttp('http:', domain, port);
                                status = result.status;
                                isCloudflare = result.isCloudflare;
                                finalProtocol = result.protocolUsed;
                            } catch (e2) {
                                // Keep default 'Açık' status
                            }
                        } else {
                            // If HTTP fails on assumed HTTP port, try HTTPS
                            try {
                                const result = await checkHttp('https:', domain, port);
                                status = result.status;
                                isCloudflare = result.isCloudflare;
                                finalProtocol = result.protocolUsed;
                            } catch (e2) {
                                // Keep default
                            }
                        }
                    }
                    activePorts.push({ port, status, isCloudflare, protocol: finalProtocol });
                }
            });

            await Promise.all(portChecks);
        }

        // Sort by port number
        activePorts.sort((a, b) => a.port - b.port);
        
        const isCloudflareGlobal = activePorts.some(p => p.isCloudflare);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ip, ports: activePorts, isCloudflare: isCloudflareGlobal }));
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), analyzerPlugin()],
  server: {
    proxy: {
      '/api/crt': {
        target: 'https://crt.sh',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/crt/, '')
      }
    }
  }
})
