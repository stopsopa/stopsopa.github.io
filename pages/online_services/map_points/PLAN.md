
I need to create in 

pages/online_services/map_points/index.html
&
pages/online_services/map_points/map_points.entry.tsx

(
    don't worry about transpilation i will take care of it
    just load map_points.entry.js in index.html which will be genereated right next to map_points.entry.tsx
)


Now. We have to create single page with map on the entire screen using Leaflet

starting point would be something like

```
import * as L from "leaflet";

const map = L.map("map").setView([54.5973, -5.9301], 12);

const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

L.tileLayer(tileUrl, {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
}).addTo(map);

```

what we need to create is just map on the full browser viewport

that page should ask for lon lat coordinates from browser and once it is provided it should center on that point on the map

then from that point it should allow us to right click in any point on the map and from dropdown we should be able to pick option to define new pin on the map

once we select that option popover form should show up and in it input field for name for that pin and to select color from color selector

lon,lat , label and color for each pin should be stored in url

we should be able to define multiple pins

also right click on the pin should allow us to delete given pin or edit it with the same form, just populated from information about that pin

When at laest one pin is placed on the map map shold center on that pin

if more than one pin is placed map should center all pins on the screen

only when no pin specified browser should prompt user for lon and lat (for location)

so as you can probably deduct loading url with data in url should recreate map with all pins


regarding colors

when map already have pins on the screen when selecting color under color selector all colors already used should be presented to select from - to make it easier to reuse colors

# loading

transpilation will output bundle to 

  <script type="module" src="/dist/map_points.entry.bundle.js"></script>

  load it from here