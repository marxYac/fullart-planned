const http = require('http');

const payload = JSON.stringify({
  type: 'user.created',
  data: {
    id: 'user_test_123',
    email_addresses: [{ email_address: 'test@example.com' }],
    first_name: 'Mario',
    last_name: 'Rossi',
    image_url: 'https://placehold.co/100',
    public_metadata: { role: 'super_user' }
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/clerk',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`Errore durante il test: ${e.message}`);
});

req.write(payload);
req.end();
