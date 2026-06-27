# atmos.sh — Project Spec

## Concept

A curl-friendly HTTP endpoint that returns a formatted, human-readable air quality,
pollen, and UV summary for any location. Single request, instant output, works in
any terminal.

## Usage

```bash
curl atmos.sh              # auto-detect location from IP
curl atmos.sh/Bristol      # explicit city name
curl atmos.sh/London
curl atmos.sh/51.45,-2.58  # explicit lat/lon
```

## Output

```
  Bristol, UK — Saturday 27 Jun
  ──────────────────────────────
  Air Quality    GOOD  (AQI 23)
  Pollen         HIGH  (grass)
  UV Index       6     wear SPF
  ──────────────────────────────
  ✓ Fine to go outside
```

Colour coded via ANSI codes:
- Green — Good
- Yellow — Moderate
- Red — Poor / Very Poor

## Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** None — plain Node `http` module is sufficient
- **Hosting:** Vercel (serverless functions, free tier)
- **Repo:** GitHub

## Project Structure

```
atmos.sh/
  api/
    [location].ts      # Vercel serverless function — catch-all route
  src/
    geo.ts             # Nominatim geocoding (city name → lat/lon)
    ipgeo.ts           # IP geolocation fallback
    openmeteo.ts       # Open-Meteo fetch + data mapping
    format.ts          # ANSI terminal output formatter
    verdict.ts         # Plain language verdict logic
  package.json
  tsconfig.json
  vercel.json          # Route all requests to api/[location].ts
  spec.md
```

## Vercel Config

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api/[location]" }]
}
```

## Data Sources

### 1. ipapi.co (IP Geolocation)
- **Purpose:** Auto-detect location from client IP when no location provided
- **Endpoint:** `https://ipapi.co/{ip}/json/`
- **Auth:** None — 1000 req/day free
- **Returns:** city, region, country, latitude, longitude
- **Notes:** Extract real client IP from `x-forwarded-for` header (Vercel passes this automatically)

### 2. Nominatim (OpenStreetMap)
- **Purpose:** Geocode city name to lat/lon
- **Endpoint:** `https://nominatim.openstreetmap.org/search?q={city}&format=json&limit=1`
- **Auth:** None
- **Notes:** Set a descriptive `User-Agent` header as per their fair use policy

### 2. Open-Meteo Air Quality API
- **Purpose:** AQI, pollen, UV index
- **Endpoint:** `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Auth:** None — completely free, no key
- **Params:**
  - `latitude`, `longitude`
  - `current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,uv_index,grass_pollen,birch_pollen,alder_pollen,mugwort_pollen`

## Request Flow

1. Parse URL path for location
2. If no location provided:
   - Extract client IP from `x-forwarded-for` header
   - Fetch `https://ipapi.co/{ip}/json/` to get lat/lon + city name
3. If city name provided → geocode via Nominatim → get lat/lon + display name
4. If raw `lat,lon` provided → use directly
5. Fetch current conditions from Open-Meteo AQ API
6. Map raw values to severity levels
7. Detect client type from `User-Agent` header:
   - `curl` → return ANSI-formatted plain text
   - Browser → return simple HTML page (explainer + usage instructions)
8. Return response with `Content-Type: text/plain; charset=utf-8`

## Verdict Logic (`verdict.ts`)

### AQI (European scale)
| AQI | Label | Colour |
|-----|-------|--------|
| 0–20 | Good | Green |
| 21–40 | Fair | Green |
| 41–60 | Moderate | Yellow |
| 61–80 | Poor | Red |
| 81–100 | Very Poor | Red |
| 100+ | Extremely Poor | Red |

### Pollen
- Identify dominant pollen type (highest value)
- Threshold: Low / Moderate / High / Very High
- Only surface if above Low

### UV Index
| UV | Recommendation |
|----|---------------|
| 0–2 | Low — no protection needed |
| 3–5 | Moderate — wear SPF |
| 6–7 | High — wear SPF |
| 8–10 | Very High — limit exposure |
| 11+ | Extreme — avoid midday sun |

### Bottom-line Verdict
- ✓ Fine to go outside — AQI Good/Fair, pollen Low, UV < 6
- ⚠ Take care — AQI Moderate OR pollen High OR UV 6–7
- ✗ Stay inside — AQI Poor+ OR UV 8+

## Error Handling

- No location + IP detection fails → `Could not detect location. Try: curl atmos.sh/London`
- Unknown location → `Location not found. Try: curl atmos.sh/London`
- Open-Meteo timeout → `Could not fetch air quality data. Try again shortly.`
- No pollen data (outside Europe) → omit pollen row silently
- Always return a 200 with a text response — never a raw error

## Notes

- No caching needed initially — Open-Meteo is fast and free
- Keep dependencies minimal — `node-fetch` or native fetch (Node 18+) only
- Vercel function timeout is 10s on free tier — well within budget for two API calls
- Future: add `?plain` param to strip ANSI codes for piping
