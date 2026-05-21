// Servidor LPC com relay de sprite (substitui `serve`)
// Porta 8022 — serve arquivos estáticos + endpoint /api/sprite
import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT    = parseInt(process.env.PORT || '8022');
const ROOT    = path.dirname(fileURLToPath(import.meta.url));
const pending = new Map(); // userId → { data, ts }

const MIME = {
  '.html':'text/html', '.js':'application/javascript', '.mjs':'application/javascript',
  '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.gif':'image/gif',
  '.svg':'image/svg+xml', '.json':'application/json', '.txt':'text/plain',
  '.ico':'image/x-icon', '.woff2':'font/woff2', '.woff':'font/woff',
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // POST /api/sprite  { userId, data }  — LPC envia o PNG base64
  if (req.method === 'POST' && url.pathname === '/api/sprite') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { userId, data } = JSON.parse(body);
        if (!userId || !data) throw new Error('campos faltando');
        pending.set(userId, { data, ts: Date.now() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        console.log(`[relay] sprite recebido para userId=${userId.slice(0,8)}...`);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // GET /api/sprite/:userId  — rsabox busca o PNG
  if (req.method === 'GET' && url.pathname.startsWith('/api/sprite/')) {
    const userId = decodeURIComponent(url.pathname.slice('/api/sprite/'.length));
    const entry  = pending.get(userId);
    if (!entry) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'nenhum sprite pendente' }));
      return;
    }
    pending.delete(userId); // consome uma vez
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, data: entry.data }));
    return;
  }

  // Servir arquivos estáticos
  let filePath = path.join(ROOT, url.pathname === '/' ? '/index.html' : url.pathname);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Tenta index.html dentro do diretório (SPA fallback)
      const idx = path.join(filePath, 'index.html');
      fs.stat(idx, (e2, s2) => {
        if (!e2 && s2.isFile()) serve(res, idx);
        else { res.writeHead(404); res.end('Not Found'); }
      });
      return;
    }
    serve(res, filePath);
  });
});

function serve(res, filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, () => console.log(`[lpc-server] http://localhost:${PORT}`));
