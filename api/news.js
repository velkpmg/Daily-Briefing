const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const payload = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: req.body.prompt }]
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const data = await new Promise((resolve, reject) => {
    const apiReq = https.request(options, apiRes => {
      let body = '';
      apiRes.on('data', chunk => body += chunk);
      apiRes.on('end', () => resolve({ status: apiRes.statusCode, body }));
    });
    apiReq.on('error', reject);
    apiReq.write(payload);
    apiReq.end();
  });

  res.status(data.status).json(JSON.parse(data.body));
};
