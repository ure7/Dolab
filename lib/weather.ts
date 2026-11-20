// Today's weather from Open-Meteo (https://open-meteo.com): free, no API key,
// no account. Fetched on the server and cached for 30 minutes, so opening the
// Outfits page often doesn't call the weather service every time.

export type Weather = {
  temperature: number; // °C now
  feelsLike: number; // °C now, "apparent temperature" (wind/humidity included)
  high: number; // today's max °C
  low: number; // today's min °C
  rainChance: number; // today's max precipitation probability, 0–100
  code: number; // WMO weather code (what the sky is doing)
};

export type WeatherKind = "clear" | "partlyCloudy" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "showers" | "thunder";

/** WMO weather codes → a few simple kinds (https://open-meteo.com/en/docs). */
export function weatherKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code <= 2) return "partlyCloudy";
  if (code === 3) return "cloudy";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 86) return "showers";
  return "thunder";
}

export async function getWeather(latitude: number, longitude: number): Promise<Weather | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "1",
  }).toString();

  try {
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      rainChance: data.daily.precipitation_probability_max[0] ?? 0,
      code: data.current.weather_code,
    };
  } catch {
    return null; // offline / service down: the page simply shows no weather
  }
}

/**
 * How many layers to wear, from how warm it FEELS:
 *   hot  (26°+)   → no hoodie or jacket
 *   warm (19–25°) → no layers needed
 *   mild (12–18°) → one layer (hoodie or jacket)
 *   cold (5–11°)  → a jacket (a hoodie under it is fine)
 *   freezing (<5°)→ hoodie AND jacket
 * Rain likely (50%+ or raining now) → a jacket is preferred.
 */
export type Layering = "none" | "one" | "outer" | "two";
export type WeatherAdvice = { band: "hot" | "warm" | "mild" | "cold" | "freezing"; layering: Layering; rain: boolean };

export function adviceFor(weather: Weather): WeatherAdvice {
  const t = weather.feelsLike;
  const kind = weatherKind(weather.code);
  const rain = weather.rainChance >= 50 || ["drizzle", "rain", "showers", "thunder"].includes(kind);
  if (t >= 26) return { band: "hot", layering: "none", rain };
  if (t >= 19) return { band: "warm", layering: rain ? "outer" : "none", rain };
  if (t >= 12) return { band: "mild", layering: rain ? "outer" : "one", rain };
  if (t >= 5) return { band: "cold", layering: "outer", rain };
  return { band: "freezing", layering: "two", rain };
}
