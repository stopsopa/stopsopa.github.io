/**
 * Tests for convert.ts (offline part only - convertShort() needs network so it is not tested here)
 *
 * node --test pages/services/maps_apple_to_google/convert.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { convert } from "./convert.ts";

test("place link with coordinate", () => {
  assert.equal(
    convert("https://maps.apple.com/place?coordinate=55.119257,-6.659260&name=62%20Mountsandel%20Road&map=explore"),
    "https://www.google.com/maps/search/?api=1&query=55.119257%2C-6.659260",
  );
});

test("directions link with address destination and coordinate source", () => {
  assert.equal(
    convert(
      "https://maps.apple.com/directions?destination=29A%20New%20Row,%20Coleraine,%20BT52%201AD,%20Northern%20Ireland&destination-place-id=IF1BEBD1631DCFAF9&mode=driving&source=55.075455,-6.640447",
    ),
    "https://www.google.com/maps/dir/?api=1&origin=55.075455%2C-6.640447&destination=29A+New+Row%2C+Coleraine%2C+BT52+1AD%2C+Northern+Ireland&travelmode=driving",
  );
});

test("directions link without source and mode", () => {
  assert.equal(
    convert("https://maps.apple.com/directions?destination=55.1,-6.6"),
    "https://www.google.com/maps/dir/?api=1&destination=55.1%2C-6.6",
  );
});

test("cycling mode maps to bicycling", () => {
  const url = new URL(convert("https://maps.apple.com/directions?destination=55.1,-6.6&mode=cycling") as string);

  assert.equal(url.searchParams.get("travelmode"), "bicycling");
});

test("legacy directions params (daddr, saddr, dirflg)", () => {
  const url = new URL(convert("https://maps.apple.com/?daddr=Coleraine&saddr=55.1,-6.6&dirflg=w") as string);

  assert.equal(url.pathname, "/maps/dir/");
  assert.equal(url.searchParams.get("destination"), "Coleraine");
  assert.equal(url.searchParams.get("origin"), "55.1,-6.6");
  assert.equal(url.searchParams.get("travelmode"), "walking");
});

test("legacy place params (ll wins over q)", () => {
  const url = new URL(convert("https://maps.apple.com/?ll=55.1,-6.6&q=Some%20Pub") as string);

  assert.equal(url.pathname, "/maps/search/");
  assert.equal(url.searchParams.get("query"), "55.1,-6.6");
});

test("place link with only address", () => {
  const url = new URL(convert("https://maps.apple.com/place?address=29A%20New%20Row,%20Coleraine") as string);

  assert.equal(url.searchParams.get("query"), "29A New Row, Coleraine");
});

test("short link can't be converted offline", () => {
  assert.equal(convert("https://maps.apple/p/=yMRN7_K4hFfhg"), null);
  assert.equal(convert("https://maps.apple/p/W~5mr5ufkx8uuu"), null);
});

/**
 * Every link from RESEARCH.md in the same order, with exactly the result predicted there
 * (null = "can't be converted offline").
 */
const taskMdCases: [string, string | null][] = [
  [
    "https://maps.apple.com/place?coordinate=55.119257,-6.659260&name=62%20Mountsandel%20Road&map=explore",
    "https://www.google.com/maps/search/?api=1&query=55.119257%2C-6.659260",
  ],
  [
    "https://maps.apple.com/directions?destination=29A%20New%20Row,%20Coleraine,%20BT52%201AD,%20Northern%20Ireland&destination-place-id=IF1BEBD1631DCFAF9&mode=driving&source=55.075455,-6.640447",
    "https://www.google.com/maps/dir/?api=1&origin=55.075455%2C-6.640447&destination=29A+New+Row%2C+Coleraine%2C+BT52+1AD%2C+Northern+Ireland&travelmode=driving",
  ],
  [
    "https://maps.apple.com/directions?destination=29A%20New%20Row,%20Coleraine,%20BT52%201AD,%20Northern%20Ireland&destination-place-id=IF1BEBD1631DCFAF9&mode=driving&source=55.075455,-6.640447",
    "https://www.google.com/maps/dir/?api=1&origin=55.075455%2C-6.640447&destination=29A+New+Row%2C+Coleraine%2C+BT52+1AD%2C+Northern+Ireland&travelmode=driving",
  ],
  ["https://maps.apple/p/=yMRN7_K4hFfhg", null],
  ["https://maps.apple/p/W~5mr5ufkx8uuu", null],
  ["https://maps.apple/p/KRN7dWDNuj6K76", null],
  ["https://maps.apple/p/5GefIkKJtqbr3_", null],
  ["https://maps.apple/p/HRLu8Gtf1CPqIy", null],
];

taskMdCases.forEach(([link, expected], i) => {
  test(`RESEARCH.md link ${i + 1}: ${link.slice(0, 50)}`, () => {
    assert.equal(convert(link), expected);
  });
});

test("not convertible input returns null", () => {
  assert.equal(convert("https://maps.apple.com/place?map=explore"), null);
  assert.equal(convert("https://example.com/place?coordinate=55.1,-6.6"), null);
  assert.equal(convert("not a link"), null);
  assert.equal(convert(""), null);
});
