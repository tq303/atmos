export interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
  };
}

export async function geocodeCity(city: string): Promise<GeoResult | null> {
  const params = new URLSearchParams({ q: city, format: 'json', limit: '1', addressdetails: '1' });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        'User-Agent': 'atmos.sh/1.0 (curl-friendly air quality tool; open source)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!res.ok) return null;

  const results = (await res.json()) as NominatimResult[];
  if (!results.length) return null;

  const r = results[0];
  const cityName = r.address.city ?? r.address.town ?? r.address.village ?? r.name;
  const country = r.address.country_code?.toUpperCase() ?? r.address.country ?? '';
  const displayName = `${cityName}, ${country}`;

  return { lat: parseFloat(r.lat), lon: parseFloat(r.lon), displayName };
}
