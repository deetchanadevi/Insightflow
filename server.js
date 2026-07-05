/**
 * PredictIQ Static Web Server
 * Runs locally on Node.js using built-in modules only (no npm installations needed).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);

    // Standardize URL and map base "/" to index.html
    let filePath = req.url === '/' ? './index.html' : '.' + req.url;
    
    // Resolve relative path to absolute
    const resolvedPath = path.resolve(__dirname, filePath);
    
    // Safety check: ensure file requests do not traverse outside project directory
    if (!resolvedPath.startsWith(__dirname)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Access Denied');
        return;
    }

    const extname = String(path.extname(resolvedPath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(resolvedPath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Return fallback 404 page
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain');
                res.end('File Not Found (404)');
            } else {
                // Return generic 500 error
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end(`Internal Server Error: ${error.code}`);
            }
        } else {
            // Serve file content
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 PredictIQ Prototype Server is running!`);
    console.log(`🌐 Navigate to: http://localhost:${PORT}`);
    console.log(`===================================================`);
    console.log(`Press Ctrl+C to terminate server.`);
});
