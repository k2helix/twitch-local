const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(`[${req.method}] ${req.socket.remoteAddress.split(':').pop()} ${req.url}`)
    res.setHeader('Access-Control-Allow-Origin', '*');
    const filePath = path.join(__dirname, req.url);
    if (fs.existsSync(filePath) && req.url !== '/') {
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } else {
        res.writeHead(302, { 'Location': '/index.html' });
        res.end();
    }
});

const port = 8000;
server.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
