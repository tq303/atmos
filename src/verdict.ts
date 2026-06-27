export type AqiColor = 'green' | 'yellow' | 'red';

export interface AqiInfo {
  label: string;
  color: AqiColor;
}

export interface UvInfo {
  label: string;
  recommendation: string;
  color: AqiColor;
}

export function getAqiInfo(aqi: number): AqiInfo {
  if (aqi <= 20) return { label: 'Good', color: 'green' };
  if (aqi <= 40) return { label: 'Fair', color: 'green' };
  if (aqi <= 60) return { label: 'Moderate', color: 'yellow' };
  if (aqi <= 80) return { label: 'Poor', color: 'red' };
  if (aqi <= 100) return { label: 'Very Poor', color: 'red' };
  return { label: 'Extremely Poor', color: 'red' };
}

export function getPollenLevel(value: number): { label: string; color: AqiColor } {
  if (value < 10) return { label: 'Low', color: 'green' };
  if (value < 50) return { label: 'Moderate', color: 'yellow' };
  if (value < 200) return { label: 'High', color: 'red' };
  return { label: 'Very High', color: 'red' };
}

export function getUvInfo(uv: number): UvInfo {
  if (uv <= 2) return { label: 'Low', recommendation: 'no protection needed', color: 'green' };
  if (uv <= 5) return { label: 'Moderate', recommendation: 'wear SPF', color: 'yellow' };
  if (uv <= 7) return { label: 'High', recommendation: 'wear SPF', color: 'yellow' };
  if (uv <= 10) return { label: 'Very High', recommendation: 'limit exposure', color: 'red' };
  return { label: 'Extreme', recommendation: 'avoid midday sun', color: 'red' };
}

export interface Conditions {
  aqi: number;
  dominantPollenValue: number | null;
  uv: number;
}

export function getVerdict(conditions: Conditions): { symbol: string; text: string; color: AqiColor } {
  const { aqi, dominantPollenValue, uv } = conditions;
  const aqiInfo = getAqiInfo(aqi);
  const pollenLabel = dominantPollenValue !== null ? getPollenLevel(dominantPollenValue).label : 'Low';

  if (aqiInfo.color === 'red' || uv >= 8) {
    return { symbol: '✗', text: 'Stay inside', color: 'red' };
  }
  if (
    aqiInfo.label === 'Moderate' ||
    pollenLabel === 'High' ||
    pollenLabel === 'Very High' ||
    (uv >= 6 && uv <= 7)
  ) {
    return { symbol: '⚠', text: 'Take care', color: 'yellow' };
  }
  return { symbol: '✓', text: 'Fine to go outside', color: 'green' };
}
