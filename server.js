// 简单的HTTP服务器，用于显示网页应用
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = 3000;
const HOST = 'localhost';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '.');

const server = http.createServer(async (req, res) => {
    try {
        let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);
        
        // 处理URL中的查询参数
        const queryIndex = filePath.indexOf('?');
        if (queryIndex !== -1) {
            filePath = filePath.substring(0, queryIndex);
        }
        
        const extname = path.extname(filePath);
        let contentType = 'text/html';
        
        switch (extname) {
            case '.js':
                contentType = 'application/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpeg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }
        
        // 检查路径是否为目录
        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                // 如果是目录，重定向到index.html
                res.writeHead(302, { 'Location': '/index.html' });
                res.end();
                return;
            }
        } catch (statError) {
            // 如果stat失败，继续处理
        }
        
        // 使用Promise版本的readFile
        const content = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            // 文件不存在，返回404页面
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            // 其他错误
            res.writeHead(500);
            res.end('500 Internal Server Error: ' + error.code);
        }
    }
});

server.listen(PORT, HOST, () => {
    console.log(`服务器运行在 http://${HOST}:${PORT}/`);
    console.log('按 Ctrl+C 停止服务器');
});