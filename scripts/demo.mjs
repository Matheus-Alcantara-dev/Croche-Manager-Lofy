import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url)).replace(/[\\/]$/, '');
const index = resolve(root, 'index.html');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
};

try {
  await stat(index);
} catch {
  console.error('A pasta dist esta ausente. Rode npm ci e npm run build:web primeiro.');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (!(await stat(path).catch(() => null))?.isFile()) {
      if (extname(pathname)) {
        res.writeHead(404).end();
        return;
      }
      path = index;
    }
    res.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
    res.end(await readFile(path));
  } catch {
    res.writeHead(400).end();
  }
});

const port = Number(process.env.LOFY_DEMO_PORT ?? 8090);
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? 'A porta ja esta em uso. Abra a demonstracao que estiver rodando.' : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + server.address().port;
  console.log('Croche Manager: ' + url);
  console.log('Mantenha esta janela aberta durante o uso.');
  if (process.argv.includes('--open')) {
    const tool = { win32: 'explorer.exe', darwin: 'open', linux: 'xdg-open' }[process.platform];
    if (tool) {
      const browser = spawn(tool, [url], { detached: true, stdio: 'ignore' });
      browser.on('error', () => console.log('Abra o endereco acima no navegador.'));
      browser.unref();
    }
  }
});
