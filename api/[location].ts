import type { IncomingMessage, ServerResponse } from 'node:http';
import { handle } from '../src/handler.ts';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handle(req, res);
}
