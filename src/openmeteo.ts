export interface AirQualityData {
  aqi: number;
  uv: number;
  dominantPollen: { type: string; value: number } | null;
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current:
      'european_aqi,uv_index,grass_pollen,birch_pollen,alder_pollen,mugwort_pollen',
  });

  const res = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`,
    { signal: AbortSignal.timeout(8000) },
  );

  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);

  const data = (await res.json()) as Record<string, Record<string, number | null>>;
  const c = data.current;

  const pollens: [string, number | null][] = [
    ['grass', c.grass_pollen ?? null],
    ['birch', c.birch_pollen ?? null],
    ['alder', c.alder_pollen ?? null],
    ['mugwort', c.mugwort_pollen ?? null],
  ];

  const valid = pollens.filter((p): p is [string, number] => p[1] !== null && p[1] > 0);
  valid.sort((a, b) => b[1] - a[1]);

  return {
    aqi: (c.european_aqi as number) ?? 0,
    uv: (c.uv_index as number) ?? 0,
    dominantPollen: valid.length > 0 ? { type: valid[0][0], value: valid[0][1] } : null,
  };
}
