export interface IpGeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

async function getPublicIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(3000) });
    return res.ok ? (await res.text()).trim() : null;
  } catch {
    return null;
  }
}

export async function geolocateIp(ip: string): Promise<IpGeoResult | null> {
  const resolvedIp = isPrivateIp(ip) ? (await getPublicIp() ?? ip) : ip;

  const res = await fetch(`https://ipwho.is/${resolvedIp}`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, unknown>;
  if (!data.success) return null;

  return {
    lat: data.latitude as number,
    lon: data.longitude as number,
    displayName: `${data.city}, ${data.country}`,
  };
}
