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

export function getWindInfo(speed: number, degrees: number): { label: string; color: AqiColor; direction: string } {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const direction = directions[Math.round(degrees / 45) % 8];

  if (speed < 6) return { label: 'Calm', color: 'green', direction };
  if (speed < 20) return { label: 'Light', color: 'green', direction };
  if (speed < 40) return { label: 'Moderate', color: 'yellow', direction };
  if (speed < 60) return { label: 'Strong', color: 'red', direction };
  return { label: 'Storm', color: 'red', direction };
}

export function getPrecipitationInfo(mm: number, probability: number): { label: string; color: AqiColor } {
  if (mm === 0 && probability < 20) return { label: 'None', color: 'green' };
  if (mm === 0 && probability < 60) return { label: 'Possible', color: 'yellow' };
  if (mm === 0) return { label: 'Likely', color: 'yellow' };
  if (mm < 2.5) return { label: 'Light', color: 'yellow' };
  if (mm < 7.5) return { label: 'Moderate', color: 'red' };
  return { label: 'Heavy', color: 'red' };
}

export function getHumidityInfo(humidity: number): { label: string; color: AqiColor } {
  if (humidity < 30) return { label: 'Dry', color: 'yellow' };
  if (humidity < 60) return { label: 'Comfortable', color: 'green' };
  if (humidity < 80) return { label: 'Humid', color: 'yellow' };
  return { label: 'Very Humid', color: 'red' };
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
