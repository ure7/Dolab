"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { setWeatherLocation } from "./actions";

type Place = { id: number; name: string; country?: string; admin1?: string; latitude: number; longitude: number };

// Pick the place for weather-based ideas: search a city (Open-Meteo's free
// geocoding, called only when you press Search) or use the device location.
export function LocationPicker({ startOpen }: { startOpen: boolean }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(startOpen);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function save(city: string | null, latitude: number, longitude: number) {
    setError(null);
    start(async () => {
      const result = await setWeatherLocation(city, latitude, longitude);
      if (result.status === "error") setError(t.weather.saveFailed);
      else {
        setOpen(false);
        setResults(null);
      }
    });
  }

  function search(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setError(null);
    start(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?count=5&format=json&language=${locale}&name=${encodeURIComponent(query.trim())}`;
        const data = await fetch(url).then((r) => r.json());
        setResults((data.results ?? []) as Place[]);
      } catch {
        setResults([]);
      }
    });
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) return setError(t.weather.locationFailed);
    navigator.geolocation.getCurrentPosition(
      (pos) => save(null, pos.coords.latitude, pos.coords.longitude),
      () => setError(t.weather.locationFailed),
      { timeout: 10_000 },
    );
  }

  if (!open) {
    return (
      <Button variant="ghost" className="min-h-9 self-start px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
        {t.weather.change}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.weather.searchCity}
          aria-label={t.weather.searchCity}
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none"
        />
        <Button type="submit" variant="secondary" disabled={isPending}>
          {t.weather.search}
        </Button>
        <Button variant="ghost" disabled={isPending} onClick={useMyLocation}>
          {t.weather.useLocation}
        </Button>
      </form>
      {results && results.length === 0 && <p className="text-sm text-muted">{t.weather.noResults}</p>}
      {results && results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((place) => {
            const label = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
            return (
              <li key={place.id}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => save(place.name, place.latitude, place.longitude)}
                  className="press w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-raised"
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
