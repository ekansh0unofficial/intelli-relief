export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

// ── India Post PIN code API ─────────────────────────────────────────────────
// Free, no key. Resolves any 6-digit Indian PIN to its canonical area name,
// district, and state — the clean identifiers Nominatim can actually find.

interface PostOffice {
  Name: string;
  District: string;
  State: string;
}

async function resolvePin(pinCode: string): Promise<PostOffice | null> {
  try {
    const resp = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data?.[0]?.Status !== "Success") return null;
    const offices: PostOffice[] = data[0].PostOffice;
    return offices?.length ? offices[0] : null;
  } catch {
    return null;
  }
}

// ── Nominatim ───────────────────────────────────────────────────────────────

async function tryNominatim(query: string): Promise<GeocodeResult | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
    const resp = await fetch(url, {
      headers: { "Accept-Language": "en-US,en", "User-Agent": "IntelliRelief/2.0" },
    });
    if (!resp.ok) return null;
    const data: Array<{ lat: string; lon: string; display_name: string }> = await resp.json();
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Geocode a free-text Indian address. Completely free, no API key required.
 *
 * Strategy:
 *  1. Extract the 6-digit PIN code from the address.
 *  2. Resolve it via India Post PIN API → canonical area name + district + state.
 *     This strips street-level noise that confuses Nominatim.
 *  3. Query Nominatim with "Area, District, State" (clean, authoritative names).
 *  4. If that fails, try "District, State" (coarser but reliable).
 *  5. If no PIN found, fall back to progressive text search on the last 2–3
 *     comma-segments (skip hyper-local street prefix).
 *
 * Why this works:
 *  Raw text like "Street No 4 Ward No 4 Tapa Tappa(R)" trips Nominatim into
 *  matching a different town. The India Post API maps PIN 148108 → "Tapa Tappa,
 *  Sangrur, Punjab" which is the correct unambiguous query.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  // Clean the address
  const cleaned = address
    .replace(/\([^)]*\)/g, "")           // strip (R), (U), (Rural) etc.
    .replace(/(\w)-(\d{6})/g, "$1 $2")   // "Sangrur-148108" → "Sangrur 148108"
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 1);

  const pinMatch = cleaned.match(/\b(\d{6})\b/);
  const pinCode = pinMatch?.[1];

  // ── Path A: PIN code present ─────────────────────────────────────────────
  if (pinCode) {
    const po = await resolvePin(pinCode);
    if (po) {
      // Most specific: area name + district + state
      const r1 = await tryNominatim(`${po.Name}, ${po.District}, ${po.State}, India`);
      if (r1) return r1;
      // Coarser: district + state (always resolvable)
      const r2 = await tryNominatim(`${po.District}, ${po.State}, India`);
      if (r2) return r2;
    }
  }

  // ── Path B: no PIN, or PIN lookup failed ─────────────────────────────────
  // Skip hyper-local prefix (street/ward), try from the 2nd segment onward.
  // Also strip any bare 6-digit segment to avoid re-triggering the same ambiguity.
  const broadParts = parts.filter((p) => !/^\d{6}$/.test(p));
  for (let i = Math.max(0, broadParts.length - 3); i < broadParts.length; i++) {
    const query = broadParts.slice(i).join(", ");
    if (!query) continue;
    const r = await tryNominatim(query);
    if (r) return r;
  }

  return null;
}

/** Returns true when coordinates look like null-island (never geocoded). */
export function isNullIsland(lat: number, lon: number): boolean {
  return Math.abs(lat) < 0.001 && Math.abs(lon) < 0.001;
}
