const OTM_KEY = process.env.OPENTRIPMAP_API_KEY || process.env.EXPO_PUBLIC_OPENTRIPMAP_API_KEY;
if (!OTM_KEY) {
  console.warn('OpenTripMap API key not found in env (OPENTRIPMAP_API_KEY or EXPO_PUBLIC_OPENTRIPMAP_API_KEY).');
}

export async function geocodeCity(city: string) {
  const q = encodeURIComponent(city);
  const url = `https://nominatim.openstreetmap.org/search?city=${q}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'YesDateApp/1.0 (contact@example.com)' } });
  if (!res.ok) throw new Error('Geocoding failed');
  const data: any = await res.json();
  if (!data || !Array.isArray(data) || data.length === 0) throw new Error('City not found');
  const first = data[0];
  return { lat: parseFloat(String(first.lat)), lon: parseFloat(String(first.lon)) };
}

export async function fetchPlacesByRadius(lat: number, lon: number, radius = 5000, limit = 20) {
  if (!OTM_KEY) throw new Error('Missing OpenTripMap API key');
  const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&limit=${limit}&format=json&apikey=${OTM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OpenTripMap places fetch failed');
  const list = await res.json();
  return list;
}

export async function fetchPlaceDetails(xid: string) {
  if (!OTM_KEY) throw new Error('Missing OpenTripMap API key');
  const url = `https://api.opentripmap.com/0.1/en/places/xid/${encodeURIComponent(xid)}?apikey=${OTM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OpenTripMap details fetch failed');
  const details = await res.json();
  return details;
}
