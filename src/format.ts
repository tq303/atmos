import { getAqiInfo, getPollenLevel, getUvInfo, getVerdict } from './verdict.ts';
import type { AirQualityData } from './openmeteo.ts';

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
} as const;

type AnsiColor = 'green' | 'yellow' | 'red';

function ansi(text: string, color: AnsiColor, bold = false): string {
  return `${bold ? C.bold : ''}${C[color]}${text}${C.reset}`;
}

function col(plain: string, width: number, color: AnsiColor | null, useAnsi: boolean): string {
  const pad = ' '.repeat(Math.max(0, width - plain.length));
  if (!useAnsi || !color) return plain + pad;
  return ansi(plain, color, true) + pad;
}

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

const SEP = '  ──────────────────────────────';
const COL = 14;

export function formatAnsi(location: string, data: AirQualityData): string {
  const aqiInfo = getAqiInfo(data.aqi);
  const uvInfo = getUvInfo(data.uv);
  const verdict = getVerdict({
    aqi: data.aqi,
    dominantPollenValue: data.dominantPollen?.value ?? null,
    uv: data.uv,
  });

  const date = formatDateTime(new Date());
  const lines: string[] = [''];

  lines.push(`  ${ansi(location, 'green', true)} — ${date}`);
  lines.push(SEP);
  lines.push(`  Air Quality    ${col(aqiInfo.label, COL, aqiInfo.color, true)}  (AQI ${data.aqi})`);

  if (data.dominantPollen) {
    const pl = getPollenLevel(data.dominantPollen.value);
    if (pl.label !== 'Low') {
      lines.push(
        `  Pollen         ${col(pl.label, COL, pl.color, true)}  (${data.dominantPollen.type})`,
      );
    }
  }

  lines.push(`  UV Index       ${col(String(data.uv), COL, uvInfo.color, true)}  ${uvInfo.recommendation}`);
  lines.push(SEP);
  lines.push(`  ${ansi(`${verdict.symbol} ${verdict.text}`, verdict.color, true)}`);
  lines.push('');

  return lines.join('\n');
}

export function formatHtml(location: string, data: AirQualityData): string {
  const aqiInfo = getAqiInfo(data.aqi);
  const uvInfo = getUvInfo(data.uv);
  const verdict = getVerdict({
    aqi: data.aqi,
    dominantPollenValue: data.dominantPollen?.value ?? null,
    uv: data.uv,
  });

  const colorMap: Record<AnsiColor, string> = { green: '#3fb950', yellow: '#d29922', red: '#f85149' };
  const date = formatDateTime(new Date());

  let pollenRow = '';
  if (data.dominantPollen) {
    const pl = getPollenLevel(data.dominantPollen.value);
    if (pl.label !== 'Low') {
      pollenRow = `<tr><td>Pollen</td><td style="color:${colorMap[pl.color]}">${pl.label}</td><td>${data.dominantPollen.type}</td></tr>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>atmos.sh — ${escHtml(location)}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:monospace;background:#0d1117;color:#c9d1d9;max-width:640px;margin:2rem auto;padding:1rem}
    h1{color:#58a6ff;margin:0 0 .25rem}
    p.sub{color:#8b949e;margin:0 0 1.5rem}
    table{border-collapse:collapse;width:100%;margin-bottom:1rem}
    td{padding:.4rem .75rem}
    td:first-child{color:#8b949e;width:130px}
    td:nth-child(2){font-weight:bold}
    .sep{border-top:1px solid #30363d}
    pre{background:#161b22;padding:1rem;border-radius:6px;overflow-x:auto}
    .verdict{font-size:1.1rem;margin-top:.5rem}
  </style>
</head>
<body>
  <h1>atmos.sh</h1>
  <p class="sub">${escHtml(location)} — ${escHtml(date)}</p>
  <table>
    <tr><td>Air Quality</td><td style="color:${colorMap[aqiInfo.color]}">${escHtml(aqiInfo.label)}</td><td>AQI ${data.aqi}</td></tr>
    ${pollenRow}
    <tr><td>UV Index</td><td style="color:${colorMap[uvInfo.color]}">${data.uv}</td><td>${escHtml(uvInfo.recommendation)}</td></tr>
    <tr class="sep"><td colspan="3" class="verdict" style="color:${colorMap[verdict.color]}">${escHtml(verdict.symbol)} ${escHtml(verdict.text)}</td></tr>
  </table>
  <p style="color:#8b949e">Use from your terminal:</p>
  <pre>curl atmos.sh              # auto-detect from IP
curl atmos.sh/${escHtml(encodeURIComponent(location))}
curl atmos.sh/London
curl atmos.sh/51.45,-2.58  # lat,lon</pre>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
