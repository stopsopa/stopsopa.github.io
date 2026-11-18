/**
 * Converts Apple Maps links to Google Maps links pointing to the same place.
 * Created because links people send open Apple Maps, and I want Google Maps instead.
 *
 * Output uses the official Google "Maps URLs" format (api=1), which works in browser and in the mobile app.
 *
 * convert("https://maps.apple.com/place?coordinate=55.119257,-6.659260&name=62%20Mountsandel%20Road&map=explore")
 *   -> "https://www.google.com/maps/search/?api=1&query=55.119257%2C-6.659260"
 *
 * convert("https://maps.apple.com/directions?destination=29A%20New%20Row&mode=driving&source=55.075455,-6.640447")
 *   -> "https://www.google.com/maps/dir/?api=1&origin=55.075455%2C-6.640447&destination=29A+New+Row&travelmode=driving"
 *
 * convert("https://maps.apple/p/=yMRN7_K4hFfhg")
 *   -> null (short link, opaque id, can't be converted without network - use convertShort())
 *
 * await convertShort("https://maps.apple/p/=yMRN7_K4hFfhg")
 *   -> follows the redirect and converts the long link (or null)
 */

const GOOGLE = "https://www.google.com/maps";

// apple travel modes (new "mode" param and legacy "dirflg" param) -> google travelmode
const modes: Record<string, string> = {
  driving: "driving",
  walking: "walking",
  transit: "transit",
  cycling: "bicycling",
  d: "driving",
  w: "walking",
  r: "transit",
};

/**
 * Pure offline conversion of long maps.apple.com links.
 * Returns null when the link is not convertible (not an apple link, short link, no location in it).
 * Apple only params (name, map, destination-place-id ...) are dropped.
 */
export function convert(link: string): string | null {
  let url: URL;

  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }

  if (url.hostname !== "maps.apple.com") {
    return null;
  }

  const p = url.searchParams;

  // directions link (daddr/saddr/dirflg are legacy names of the same params)
  const destination = p.get("destination") || p.get("daddr");

  if (destination) {
    const out = new URLSearchParams({ api: "1" });

    // no origin -> google starts from current location
    const origin = p.get("source") || p.get("saddr");

    if (origin) {
      out.set("origin", origin);
    }

    out.set("destination", destination);

    const mode = modes[p.get("mode") || p.get("dirflg") || ""];

    if (mode) {
      out.set("travelmode", mode);
    }

    return `${GOOGLE}/dir/?${out}`;
  }

  // place link: coordinates are exact, so prefer them over any text
  const query = p.get("coordinate") || p.get("ll") || p.get("address") || p.get("q") || p.get("name");

  if (query) {
    return `${GOOGLE}/search/?${new URLSearchParams({ api: "1", query })}`;
  }

  return null;
}

/**
 * For short links (https://maps.apple/p/...): the id is opaque, so ask Apple's server
 * where it points (follow redirect) and convert the final long link.
 * Works for long links too. Needs network.
 */
export async function convertShort(link: string): Promise<string | null> {
  const res = await fetch(link, { redirect: "follow" });

  return convert(res.url);
}
