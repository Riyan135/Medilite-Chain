const https = require('https');

const data = JSON.stringify({
  doctorId: 'DOC-123',
  name: 'test',
  email: 'test@test.com'
});

const options = {
  hostname: 'medilite-chain-server.vercel.app',
  port: 443,
  path: '/api/auth/doctor/request-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
