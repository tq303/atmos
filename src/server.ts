import { createServer } from 'node:http';
import { handle } from './handler.ts';

const PORT = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    res.end('Internal error\n');
  });
}).listen(PORT, () => {
  console.log(`atmos running on http://localhost:${PORT}`);
  console.log(`  curl http://localhost:${PORT}/Bristol`);
});
