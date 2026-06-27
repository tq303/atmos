export interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

export async function geocodeCity(city: string): Promise<GeoResult | null> {
  const params = new URLSearchParams({ q: city, format: 'json', limit: '1' });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { 'User-Agent': 'atmos.sh/1.0 (curl-friendly air quality tool; open source)' },
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!res.ok) return null;

  const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!results.length) return null;

  const r = results[0];
  const parts = r.display_name.split(',').map((s) => s.trim());
  const displayName = parts.slice(0, 2).join(', ');

  return { lat: parseFloat(r.lat), lon: parseFloat(r.lon), displayName };
}
