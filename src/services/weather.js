'use strict';

const config = require('../config');

// Rough IANA-timezone → city map for the common cases; falls back to the
// last path segment of the timezone (e.g. Asia/Karachi → Karachi).
const TZ_CITY = {
  'Asia/Dubai': 'Dubai',
  'Asia/Karachi': 'Karachi',
  'Asia/Riyadh': 'Riyadh',
  'Asia/Kolkata': 'Mumbai',
  'Europe/London': 'London',
  'America/New_York': 'New York',
};

function cityFromTimezone(tz) {
  if (!tz) return config.weather.defaultCity;
  if (TZ_CITY[tz]) return TZ_CITY[tz];
  const seg = tz.split('/').pop() || config.weather.defaultCity;
  return seg.replace(/_/g, ' ');
}

/**
 * Get weather for a user. Returns { city, temp, condition }.
 * Uses OpenWeatherMap when WEATHER_API_KEY is set, otherwise a stable
 * fallback so briefings still render.
 */
async function getWeather(user) {
  const city = cityFromTimezone(user && user.timezone);

  if (config.weather.apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${config.weather.apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return {
          city,
          temp: Math.round(data.main && data.main.temp),
          condition: (data.weather && data.weather[0] && data.weather[0].description) || 'clear',
        };
      }
    } catch (_) { /* fall through to fallback */ }
  }

  // Fallback (no API key or request failed)
  return { city, temp: 34, condition: 'sunny', _fallback: true };
}

/**
 * Get weather for an arbitrary city name. Returns { city, temp, condition }.
 * Uses OpenWeatherMap when a key is set, else a deterministic fallback keyed
 * off the city name so prototype output is stable and plausible.
 */
async function getWeatherForCity(city) {
  const name = (city || config.weather.defaultCity || 'Dubai').trim();
  if (config.weather.apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(name)}&units=metric&appid=${config.weather.apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return {
          city: name,
          temp: Math.round(data.main && data.main.temp),
          condition: (data.weather && data.weather[0] && data.weather[0].description) || 'clear',
        };
      }
    } catch (_) { /* fall through */ }
  }
  // Deterministic fallback table for common destinations.
  const table = {
    dubai: { temp: 38, condition: 'sunny' },
    karachi: { temp: 33, condition: 'humid' },
    london: { temp: 14, condition: 'light rain' },
    'new york': { temp: 12, condition: 'cloudy' },
    riyadh: { temp: 40, condition: 'sunny' },
    istanbul: { temp: 22, condition: 'partly cloudy' },
    paris: { temp: 16, condition: 'overcast' },
  };
  const hit = table[name.toLowerCase()];
  return hit ? { city: name, ...hit, _fallback: true } : { city: name, temp: 28, condition: 'clear', _fallback: true };
}

/**
 * Packing suggestions based on a weather reading.
 * @param {{temp:number, condition:string}} w
 * @returns {string[]}
 */
function packingSuggestions(w) {
  const tips = [];
  const cond = (w.condition || '').toLowerCase();
  if (w.temp != null && w.temp > 30) tips.push('Pack light clothes, sunscreen, sunglasses');
  else if (w.temp != null && w.temp < 15) tips.push('Pack a jacket, layers, warm shoes');
  else tips.push('Pack comfortable layers');
  if (/rain|drizzle|shower|storm/.test(cond)) tips.push("Don't forget an umbrella");
  return tips;
}

module.exports = { getWeather, getWeatherForCity, cityFromTimezone, packingSuggestions };
