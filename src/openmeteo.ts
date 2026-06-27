export interface AirQualityData {
  aqi: number;
  uv: number;
  dominantPollen: { type: string; value: number } | null;
  timezone: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  const base = { latitude: lat.toString(), longitude: lon.toString(), timezone: 'auto' };

  const [aqRes, wxRes] = await Promise.all([
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${new URLSearchParams({
        ...base,
        current: 'european_aqi,uv_index,grass_pollen,birch_pollen,alder_pollen,mugwort_pollen',
      })}`,
      { signal: AbortSignal.timeout(8000) },
    ),
    fetch(
      `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
        ...base,
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m',
      })}`,
      { signal: AbortSignal.timeout(8000) },
    ),
  ]);

  if (!aqRes.ok) throw new Error(`Open-Meteo AQ responded ${aqRes.status}`);
  if (!wxRes.ok) throw new Error(`Open-Meteo weather responded ${wxRes.status}`);

  const [aq, wx] = (await Promise.all([aqRes.json(), wxRes.json()])) as Record<string, unknown>[];
  const c = aq.current as Record<string, number | null>;
  const w = wx.current as Record<string, number>;

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
    timezone: (aq.timezone as string) ?? 'UTC',
    temperature: Math.round(w.temperature_2m),
    feelsLike: Math.round(w.apparent_temperature),
    humidity: Math.round(w.relative_humidity_2m),
  };
}
