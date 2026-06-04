const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ── PUT YOUR ANTHROPIC API KEY HERE ──────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {

  // ── API PROXY ──────────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/news') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) {
        res.writeHead(400, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({error:'Bad request body'}));
      }

      const payload = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: parsed.prompt }]
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const apiReq = https.request(options, apiRes => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(data);
        });
      });

      apiReq.on('error', err => {
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error: err.message}));
      });

      apiReq.write(payload);
      apiReq.end();
    });
    return;
  }

  // ── STATIC FILES ───────────────────────────────────────────────────────────
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'public', filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {'Content-Type': MIME[ext] || 'text/plain'});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Daily Brief running on port ${PORT}`);
});
