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

async function fetchCrtSh(domain: string) {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://crt.sh/?q=${domain}&output=json`);
        if (!response.ok) return [];
        const data = await response.json();
        
        const uniqueSubdomains = new Set<string>();
        data.forEach((item: any) => {
            const parts = item.name_value.split('\n');
            parts.forEach((part: string) => {
                const cleaned = part.trim().toLowerCase();
                const finalDomain = cleaned.startsWith('*.') ? cleaned.substring(2) : cleaned;
                if (finalDomain && finalDomain.endsWith(domain)) {
                   uniqueSubdomains.add(finalDomain);
                }
            });
        });
        return Array.from(uniqueSubdomains).map(sub => ({ subdomain: sub, source: 'crt.sh' }));
    } catch {
        return [];
    }
}

async function fetchHackerTarget(domain: string) {
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(`https://api.hackertarget.com/hostsearch/?q=${domain}`);
        const text = await res.text();
        
        if (text.includes('error') || text.includes('API count exceeded')) {
            return [];
        }

        return text
            .split('\n')
            .filter(line => line.includes(','))
            .map(line => ({
                subdomain: line.split(',')[0].trim().toLowerCase(),
                ip: line.split(',')[1].trim()
            }))
            .filter(item => item.subdomain.endsWith(`.${domain}`));
    } catch {
        return [];
    }
}

// Helper function to validate domain format strictly
const isValidDomain = (domain: string) => {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
};

// 1. Yeni Birleştirilmiş Subdomain Scan Endpoint
app.get('/api/scan', async (req, res) => {
    const domain = req.query.domain as string;
    if (!domain || !isValidDomain(domain)) {
        return res.status(400).json({ error: 'Geçerli bir domain parametresi gerekli' });
    }

    try {
        const [crtResult, htResult] = await Promise.allSettled([
            fetchCrtSh(domain),
            fetchHackerTarget(domain)
        ]);

        const crtSubs = crtResult.status === 'fulfilled' ? crtResult.value : [];
        const htSubs = htResult.status === 'fulfilled' ? htResult.value : [];

        const merged = new Map();
        
        crtSubs.forEach(s => merged.set(s.subdomain, { subdomain: s.subdomain, source: 'crt.sh' }));
        htSubs.forEach(s => {
            if (merged.has(s.subdomain)) {
                const existing = merged.get(s.subdomain);
                existing.source = 'crt.sh + HackerTarget';
                if (!existing.ip && s.ip) existing.ip = s.ip;
            } else {
                merged.set(s.subdomain, { subdomain: s.subdomain, ip: s.ip, source: 'HackerTarget' });
            }
        });

        const finalResults = Array.from(merged.values()).sort((a, b) => a.subdomain.localeCompare(b.subdomain));
        res.json(finalResults);
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ error: 'Tarama sırasında hata oluştu.' });
    }
});

// Eski API endpointi geriye dönük uyumluluk için bırakılabilir veya silinebilir
app.get('/api/crt', async (req, res) => {
    const domain = req.query.q as string;
    if (!domain || !isValidDomain(domain)) {
        return res.status(400).json({ error: 'Geçerli bir domain parametresi (q) gerekli' });
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
    
    if (!domain || !isValidDomain(domain)) {
        return res.status(400).json({ error: 'Geçerli bir domain parametresi gerekli' });
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
            // Rate limiting bypass / delay for simple implementation
            await new Promise(r => setTimeout(r, Math.random() * 300));
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
                        } catch (e2: any) { }
                    } else {
                        try {
                            const result = await checkHttp('https:', domain, port);
                            status = result.status;
                            isCloudflare = result.isCloudflare;
                            finalProtocol = result.protocolUsed;
                        } catch (e2: any) { }
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

const TECH_SIGNATURES = [
  // Web Framework
  { name: "WordPress",   category: "CMS",        headers: { "x-powered-by": /wordpress/i }, html: /wp-content|wp-json/i },
  { name: "Drupal",      category: "CMS",        headers: { "x-generator": /drupal/i },     html: /Drupal\.settings/i },
  { name: "Joomla",      category: "CMS",        headers: {},                                html: /joomla/i },
  { name: "Shopify",     category: "E-Ticaret",  headers: { "x-shopify-stage": /.+/i },     html: /shopify/i },
  { name: "Magento",     category: "E-Ticaret",  headers: {},                                html: /magento|Mage\.Cookies/i },
  // Frontend
  { name: "React",       category: "Frontend",   headers: {},                                html: /react\.development|ReactDOM|__reactFiber/i },
  { name: "Next.js",     category: "Frontend",   headers: { "x-powered-by": /next\.js/i },  html: /__NEXT_DATA__/i },
  { name: "Vue.js",      category: "Frontend",   headers: {},                                html: /vue\.min\.js|__vue__/i },
  { name: "Angular",     category: "Frontend",   headers: {},                                html: /ng-version|angular\.min\.js/i },
  { name: "jQuery",      category: "Frontend",   headers: {},                                html: /jquery\.min\.js|jquery-\d/i },
  { name: "Bootstrap",   category: "Frontend",   headers: {},                                html: /bootstrap\.min\.css|bootstrap\.min\.js/i },
  // Backend
  { name: "PHP",         category: "Backend",    headers: { "x-powered-by": /php/i },       html: null },
  { name: "Laravel",     category: "Backend",    headers: {},                                html: /laravel_session/i },
  { name: "Django",      category: "Backend",    headers: {},                                html: /csrfmiddlewaretoken/i },
  { name: "ASP.NET",     category: "Backend",    headers: { "x-powered-by": /asp\.net/i },  html: /__VIEWSTATE/i },
  { name: "Ruby Rails",  category: "Backend",    headers: { "x-powered-by": /phusion/i },   html: /authenticity_token/i },
  // Sunucu
  { name: "Nginx",       category: "Sunucu",     headers: { "server": /nginx/i },            html: null },
  { name: "Apache",      category: "Sunucu",     headers: { "server": /apache/i },           html: null },
  { name: "IIS",         category: "Sunucu",     headers: { "server": /iis/i },              html: null },
  { name: "LiteSpeed",   category: "Sunucu",     headers: { "server": /litespeed/i },        html: null },
  // CDN / Cloud
  { name: "Cloudflare",  category: "CDN",        headers: { "server": /cloudflare/i },       html: null },
  { name: "AWS CloudFront", category: "CDN",     headers: { "via": /cloudfront/i },          html: null },
  { name: "Fastly",      category: "CDN",        headers: { "x-served-by": /cache/i },       html: null },
  // Analitik
  { name: "Google Analytics", category: "Analitik", headers: {},                             html: /gtag\(|ga\.js|analytics\.js/i },
  { name: "Hotjar",      category: "Analitik",   headers: {},                                html: /hotjar/i },
  // Güvenlik
  { name: "reCAPTCHA",   category: "Güvenlik",   headers: {},                                html: /recaptcha/i },
];

app.get('/api/tech', async (req, res) => {
    const subdomain = req.query.subdomain as string;
    if (!subdomain || !isValidDomain(subdomain)) {
        return res.status(400).json({ error: 'Geçerli bir subdomain gerekli' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        // 5 saniye timeout ile fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`https://${subdomain}`, { 
            signal: controller.signal as any,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        clearTimeout(timeoutId);
        
        const html = await response.text();
        const headersObj: Record<string, string> = {};
        response.headers.forEach((val, key) => {
            headersObj[key.toLowerCase()] = val;
        });

        const detected = TECH_SIGNATURES.filter(tech => {
            const headerMatch = Object.entries(tech.headers).some(
                ([key, pattern]) => pattern.test(headersObj[key.toLowerCase()] || '')
            );
            const htmlMatch = tech.html ? tech.html.test(html) : false;
            return headerMatch || htmlMatch;
        });

        res.json(detected.map(t => ({ name: t.name, category: t.category })));
    } catch (err) {
        // Hataları sessizce geç
        res.json([]);
    }
});

// Basic health check for Render
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
