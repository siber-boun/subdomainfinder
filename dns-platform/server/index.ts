import express from 'express';
import cors from 'cors';
import dns from 'node:dns';
import net from 'node:net';
import https from 'node:https';
import http from 'node:http';

const app = express();
const PORT = process.env.PORT || 3001;

// Render'da frontend ve backend ayrı URL'lerde olacağı için CORS gerekli
app.use(cors());
app.use(express.json());

const HTTP_HTTPS_PORTS = [
  80, 8080, 8000, 8008, 8888, 8081, 8082, 8083, 8084, 8090,
  443, 8443, 8444, 9443, 4443,
  3000, 3001, 4000, 5000, 9000, 9090, 9200, 7080, 7443
];

const checkPort = (port: number, host: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1500); 
        
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
            timeout: 3500,
            rejectUnauthorized: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*'
            }
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

// 1. crt.sh Proxy Endpoint
app.get('/api/crt', async (req, res) => {
    const domain = req.query.q;
    if (!domain) {
        return res.status(400).json({ error: 'Domain parametresi (q) gerekli' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://crt.sh/?q=${domain}&output=json`);
        
        if (!response.ok) {
            throw new Error(`crt.sh responded with status ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('crt.sh proxy error:', error);
        res.status(500).json({ error: 'crt.sh API\'sine erişilemedi.' });
    }
});

// 2. Subdomain Analyzer Endpoint
app.get('/api/analyze', async (req, res) => {
    const domain = req.query.domain as string;
    
    if (!domain) {
        return res.status(400).json({ error: 'Domain parametresi gerekli' });
    }

    let ip = null;
    try {
        const records = await dns.promises.resolve4(domain);
        if (records && records.length > 0) ip = records[0];
    } catch (e: any) {
        // DNS resolve failed
    }

    const activePorts: { port: number, status: number | string, isCloudflare: boolean, protocol: string }[] = [];

    if (ip) {
        const portChecks = HTTP_HTTPS_PORTS.map(async (port) => {
            const isOpen = await checkPort(port, domain);
            if (isOpen) {
                let status: number | string = 'Açık (Yanıt Yok)';
                let isCloudflare = false;
                const isHttps = [443, 8443, 8444, 9443, 4443, 7443].includes(port);
                let finalProtocol = isHttps ? 'https:' : 'http:';
                
                try {
                    const result = await checkHttp(isHttps ? 'https:' : 'http:', domain, port);
                    status = result.status;
                    isCloudflare = result.isCloudflare;
                    finalProtocol = result.protocolUsed;
                } catch (e: any) {
                    if (isHttps) {
                        try {
                            const result = await checkHttp('http:', domain, port);
                            status = result.status;
                            isCloudflare = result.isCloudflare;
                            finalProtocol = result.protocolUsed;
                        } catch (e2: any) {
                             // Fallback failed
                        }
                    } else {
                        try {
                            const result = await checkHttp('https:', domain, port);
                            status = result.status;
                            isCloudflare = result.isCloudflare;
                            finalProtocol = result.protocolUsed;
                        } catch (e2: any) {
                             // Fallback failed
                        }
                    }
                }
                activePorts.push({ port, status, isCloudflare, protocol: finalProtocol });
            }
        });

        await Promise.all(portChecks);
    }

    activePorts.sort((a, b) => a.port - b.port);
    const filteredPorts = activePorts.filter(p => p.status !== 'Açık (Yanıt Yok)');
    const isCloudflareGlobal = filteredPorts.some(p => p.isCloudflare);

    res.json({ ip, ports: filteredPorts, isCloudflare: isCloudflareGlobal });
});

// Basic health check for Render
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
