import type { IncomingMessage, ServerResponse } from 'node:http';
import { geocodeCity } from './geo.ts';
import { geolocateIp } from './ipgeo.ts';
import { fetchAirQuality } from './openmeteo.ts';
import { formatAnsi, formatHtml } from './format.ts';

const LAT_LON_RE = /^(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/;

function getClientIp(req: IncomingMessage): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? '127.0.0.1';
}

function isCurl(req: IncomingMessage): boolean {
  const ua = (req.headers['user-agent'] ?? '').toLowerCase();
  return ua.startsWith('curl');
}

export async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const raw = url.pathname.replace(/^\/+/, '').trim();
  const curl = isCurl(req);

  const send = (body: string, html = false) => {
    res.setHeader('Content-Type', html ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8');
    res.end(body);
  };

  try {
    let lat: number;
    let lon: number;
    let displayName: string;

    if (!raw) {
      const vercelLat = req.headers['x-vercel-ip-latitude'];
      const vercelLon = req.headers['x-vercel-ip-longitude'];
      const vercelCity = req.headers['x-vercel-ip-city'];
      const vercelCountry = req.headers['x-vercel-ip-country'];

      if (vercelLat && vercelLon && vercelCity) {
        lat = parseFloat(vercelLat as string);
        lon = parseFloat(vercelLon as string);
        displayName = `${decodeURIComponent(vercelCity as string)}, ${vercelCountry ?? ''}`.trim().replace(/,$/, '');
      } else {
        const ip = getClientIp(req);
        const geo = await geolocateIp(ip);
        if (!geo) {
          send('Could not detect location. Try: curl atmos.sh/London\n');
          return;
        }
        ({ lat, lon, displayName } = geo);
      }
    } else {
      const match = raw.match(LAT_LON_RE);
      if (match) {
        lat = parseFloat(match[1]);
        lon = parseFloat(match[2]);
        displayName = `${lat}, ${lon}`;
      } else {
        const geo = await geocodeCity(decodeURIComponent(raw));
        if (!geo) {
          send('Location not found. Try: curl atmos.sh/London\n');
          return;
        }
        ({ lat, lon, displayName } = geo);
      }
    }

    const data = await fetchAirQuality(lat, lon);

    if (curl) {
      send(formatAnsi(displayName, data));
    } else {
      send(formatHtml(displayName, data), true);
    }
  } catch {
    send('Could not fetch air quality data. Try again shortly.\n');
  }
}
