/**
 * Map points manager module.
 * Uses Leaflet to display map and manage pins synchronized with URL query params.
 */

import * as L from "leaflet";

// Interface representing a map pin coordinate and metadata
interface PinData {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
}

/**
 * Tile layer configurations for different map styles.
 * Free, keyless tile providers supported.
 */
interface MapLayerConfig {
  id: string;
  name: string;
  url: string;
  options: L.TileLayerOptions;
}

const MAP_LAYERS: Record<string, MapLayerConfig> = {
  standard: {
    id: "standard",
    name: "Standard (OSM)",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    },
  },
  terrain: {
    id: "terrain",
    name: "Terrain (OpenTopoMap)",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
  },
  satellite: {
    id: "satellite",
    name: "Satellite (ESRI World Imagery)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  carto_light: {
    id: "carto_light",
    name: "Light (Carto Positron)",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 20,
      subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  carto_dark: {
    id: "carto_dark",
    name: "Dark (Carto Dark Matter)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 20,
      subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
};

const DEFAULT_MAP_LAYER = "standard";

/**
 * Overlay layers (transparent overlays that can be toggled independently on top of any base layer).
 */
interface OverlayConfig {
  id: string;
  name: string;
  url: string;
  options: L.TileLayerOptions;
}

const OVERLAY_LAYERS: Record<string, OverlayConfig> = {
  labels: {
    id: "labels",
    name: "Place Names / Labels",
    url: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 20,
      subdomains: "abcd",
      pane: "overlayPane",
      zIndex: 650,
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  roads: {
    id: "roads",
    name: "Roads & Transit (CyclOSM)",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    options: {
      maxZoom: 20,
      opacity: 0.8,
      attribution: '&copy; <a href="https://www.cyclosm.org">CyclOSM</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
};

/**
 * Loads selected map style from URL query parameters.
 */
function loadMapStyleFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const style = params.get("style");
  if (style && MAP_LAYERS[style]) {
    return style;
  }
  return DEFAULT_MAP_LAYER;
}

/**
 * Loads active overlays from URL query parameters.
 * Format in query string: overlays=labels,roads
 */
function loadOverlaysFromUrl(): Set<string> {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("overlays");
  if (!raw) return new Set();
  const items = raw.split(",").map((s) => s.trim()).filter((s) => Boolean(OVERLAY_LAYERS[s]));
  return new Set(items);
}

/**
 * Saves active overlays to URL query parameter.
 */
function saveOverlaysToUrl(activeOverlayIds: Set<string>): void {
  const url = new URL(window.location.href);
  if (activeOverlayIds.size === 0) {
    url.searchParams.delete("overlays");
  } else {
    url.searchParams.set("overlays", Array.from(activeOverlayIds).sort().join(","));
  }
  window.history.replaceState({}, "", url.toString());
}

/**
 * Saves selected map style to URL query parameter.
 */
function saveMapStyleToUrl(styleId: string): void {
  const url = new URL(window.location.href);
  if (styleId === DEFAULT_MAP_LAYER) {
    url.searchParams.delete("style");
  } else {
    url.searchParams.set("style", styleId);
  }
  window.history.replaceState({}, "", url.toString());
}

/**
 * Parses pins array encoded in URL search parameters.
 * Format in query string: pins=encodeURIComponent(JSON.stringify(pins))
 */
function loadPinsFromUrl(): PinData[] {
  try {
    const params = new URLSearchParams(window.location.search);
    const pinsRaw = params.get("pins");
    if (!pinsRaw) {
      return [];
    }
    const parsed = JSON.parse(pinsRaw);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => ({
        id: String(item.id || `pin_${Date.now()}_${idx}`),
        lat: Number(item.lat),
        lng: Number(item.lng),
        label: String(item.label || ""),
        color: String(item.color || "#ea4335"),
      }));
    }
  } catch (err) {
    console.warn("map_points.entry.ts error: failed to parse pins from URL", err);
  }
  return [];
}

/**
 * Serializes pins into URL query parameter without triggering full page reload.
 */
function savePinsToUrl(pins: PinData[]): void {
  const url = new URL(window.location.href);
  if (pins.length === 0) {
    url.searchParams.delete("pins");
  } else {
    const minimal = pins.map(({ id, lat, lng, label, color }) => ({
      id,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      label,
      color,
    }));
    url.searchParams.set("pins", JSON.stringify(minimal));
  }
  window.history.replaceState({}, "", url.toString());
}

/**
 * Asynchronously requests browser geolocation to get user's current lat/lng.
 */
function requestCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("map_points.entry.ts error: Geolocation not supported by browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Creates Leaflet DivIcon for a custom-colored pin marker.
 */
function createMarkerIcon(color: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
    <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M16 1C7.716 1 1 7.716 1 16c0 10.5 15 25 15 25s15-14.5 15-25c0-8.284-6.716-15-15-15z"/>
    <circle cx="16" cy="16" r="6" fill="#ffffff"/>
  </svg>`;
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

/**
 * Main application initialization.
 */
async function initApp(): Promise<void> {
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    throw new Error("map_points.entry.ts error: #map element not found in DOM");
  }

  // Initial fallback center: Belfast coordinates from PLAN
  const defaultCenter: [number, number] = [54.5973, -5.9301];
  let pins: PinData[] = loadPinsFromUrl();
  const initialStyleId = loadMapStyleFromUrl();
  const activeOverlayIds = loadOverlaysFromUrl();

  const map = L.map("map").setView(defaultCenter, 12);

  // Initialize base tile layers dictionary
  const baseLayers: Record<string, L.TileLayer> = {};
  const layerIdMap = new Map<L.Layer, string>();

  Object.entries(MAP_LAYERS).forEach(([id, config]) => {
    const layer = L.tileLayer(config.url, config.options);
    baseLayers[config.name] = layer;
    layerIdMap.set(layer, id);
  });

  // Initialize overlay tile layers dictionary
  const overlayLayers: Record<string, L.TileLayer> = {};
  const overlayIdMap = new Map<L.Layer, string>();

  Object.entries(OVERLAY_LAYERS).forEach(([id, config]) => {
    const layer = L.tileLayer(config.url, config.options);
    overlayLayers[config.name] = layer;
    overlayIdMap.set(layer, id);
  });

  // Add the active base layer to the map based on URL state
  const activeConfig = MAP_LAYERS[initialStyleId] || MAP_LAYERS[DEFAULT_MAP_LAYER];
  const activeLayer = baseLayers[activeConfig.name];
  if (activeLayer) {
    activeLayer.addTo(map);
  }

  // Add any active overlay layers from URL state
  activeOverlayIds.forEach((overlayId) => {
    const overlayConfig = OVERLAY_LAYERS[overlayId];
    if (overlayConfig && overlayLayers[overlayConfig.name]) {
      overlayLayers[overlayConfig.name].addTo(map);
    }
  });

  // Add Leaflet Layers Control for base styles and overlays (positioned in bottom-left like Google Maps)
  L.control.layers(baseLayers, overlayLayers, { position: "bottomleft" }).addTo(map);

  // Synchronize base layer selection with URL
  map.on("baselayerchange", (e: any) => {
    const styleId = layerIdMap.get(e.layer);
    if (styleId) {
      saveMapStyleToUrl(styleId);
    }
  });

  // Synchronize overlay additions with URL
  map.on("overlayadd", (e: any) => {
    const overlayId = overlayIdMap.get(e.layer);
    if (overlayId) {
      activeOverlayIds.add(overlayId);
      saveOverlaysToUrl(activeOverlayIds);
    }
  });

  // Synchronize overlay removals with URL
  map.on("overlayremove", (e: any) => {
    const overlayId = overlayIdMap.get(e.layer);
    if (overlayId) {
      activeOverlayIds.delete(overlayId);
      saveOverlaysToUrl(activeOverlayIds);
    }
  });

  const markerInstances = new Map<string, L.Marker>();

  // Helper to re-render or add a marker on Leaflet Map
  function renderMarker(pin: PinData): void {
    const existing = markerInstances.get(pin.id);
    if (existing) {
      existing.remove();
      markerInstances.delete(pin.id);
    }

    const marker = L.marker([pin.lat, pin.lng], {
      icon: createMarkerIcon(pin.color),
      title: pin.label || "Pin",
    }).addTo(map);

    // Right-click on marker triggers context menu for edit/delete
    marker.on("contextmenu", (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e as any);
      showMarkerContextMenu(e.containerPoint.x, e.containerPoint.y, pin.id);
    });

    markerInstances.set(pin.id, marker);
  }

  // Updates map viewport according to current pin list
  function adjustViewport(): void {
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
    } else if (pins.length > 1) {
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  // Render all initial pins
  pins.forEach((p) => renderMarker(p));

  // Geolocation if no pins are specified
  if (pins.length === 0) {
    requestCurrentPosition()
      .then((coords) => {
        map.setView([coords.lat, coords.lng], 13);
      })
      .catch((err) => {
        console.warn("map_points.entry.ts notice: geolocation declined or unavailable", err);
      });
  } else {
    adjustViewport();
  }

  // UI elements
  const contextMenu = document.getElementById("context-menu")!;
  const menuAddPin = document.getElementById("menu-add-pin")!;
  const menuEditPin = document.getElementById("menu-edit-pin")!;
  const menuDeletePin = document.getElementById("menu-delete-pin")!;

  const modalBackdrop = document.getElementById("pin-modal-backdrop")!;
  const modalTitle = document.getElementById("modal-title")!;
  const pinForm = document.getElementById("pin-form") as HTMLFormElement;
  const pinLabelInput = document.getElementById("pin-label-input") as HTMLInputElement;
  const pinColorInput = document.getElementById("pin-color-input") as HTMLInputElement;
  const pinColorText = document.getElementById("pin-color-text")!;
  const paletteContainer = document.getElementById("palette-container")!;
  const btnCancel = document.getElementById("btn-cancel")!;
  const btnResetPins = document.getElementById("btn-reset-pins");

  /**
   * Resets and clears all pins from map and URL while preserving current view/style.
   */
  function handleResetPins(): void {
    if (pins.length === 0) return;
    markerInstances.forEach((marker) => marker.remove());
    markerInstances.clear();
    pins = [];
    savePinsToUrl(pins);
  }

  if (btnResetPins) {
    btnResetPins.addEventListener("click", () => {
      handleResetPins();
    });
  }

  let contextMenuTargetLatLng: { lat: number; lng: number } | null = null;
  let contextMenuTargetPinId: string | null = null;
  let activeEditingPinId: string | null = null;

  function hideContextMenu(): void {
    contextMenu.style.display = "none";
  }

  function showMapContextMenu(x: number, y: number, lat: number, lng: number): void {
    contextMenuTargetLatLng = { lat, lng };
    contextMenuTargetPinId = null;

    menuAddPin.style.display = "block";
    menuEditPin.style.display = "none";
    menuDeletePin.style.display = "none";

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = "block";
  }

  function showMarkerContextMenu(x: number, y: number, pinId: string): void {
    contextMenuTargetLatLng = null;
    contextMenuTargetPinId = pinId;

    menuAddPin.style.display = "none";
    menuEditPin.style.display = "block";
    menuDeletePin.style.display = "block";

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = "block";
  }

  // Populate color palette chips from existing pins
  function renderColorPalette(selectedColor: string): void {
    paletteContainer.innerHTML = "";
    const uniqueColors = Array.from(new Set(pins.map((p) => p.color.toLowerCase())));

    if (uniqueColors.length === 0) {
      paletteContainer.parentElement!.style.display = "none";
      return;
    }

    paletteContainer.parentElement!.style.display = "block";
    uniqueColors.forEach((color) => {
      const chip = document.createElement("div");
      chip.className = "palette-chip" + (color === selectedColor.toLowerCase() ? " active" : "");
      chip.style.backgroundColor = color;
      chip.title = color;
      chip.addEventListener("click", () => {
        pinColorInput.value = color;
        pinColorText.textContent = color;
        renderColorPalette(color);
      });
      paletteContainer.appendChild(chip);
    });
  }

  function openModal(mode: "add" | "edit", pin?: PinData): void {
    hideContextMenu();
    if (mode === "add") {
      activeEditingPinId = null;
      modalTitle.textContent = "Add Pin";
      pinLabelInput.value = "";
      pinColorInput.value = "#ea4335";
      pinColorText.textContent = "#ea4335";
    } else if (pin) {
      activeEditingPinId = pin.id;
      modalTitle.textContent = "Edit Pin";
      pinLabelInput.value = pin.label;
      pinColorInput.value = pin.color;
      pinColorText.textContent = pin.color;
    }

    renderColorPalette(pinColorInput.value);
    modalBackdrop.style.display = "flex";
    setTimeout(() => pinLabelInput.focus(), 50);
  }

  function closeModal(): void {
    modalBackdrop.style.display = "none";
    activeEditingPinId = null;
  }

  // Color picker change listener
  pinColorInput.addEventListener("input", () => {
    pinColorText.textContent = pinColorInput.value;
    renderColorPalette(pinColorInput.value);
  });

  // Modal actions
  btnCancel.addEventListener("click", () => closeModal());
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  pinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const label = pinLabelInput.value.trim();
    const color = pinColorInput.value;

    if (activeEditingPinId) {
      // Editing existing pin
      const targetPin = pins.find((p) => p.id === activeEditingPinId);
      if (targetPin) {
        targetPin.label = label;
        targetPin.color = color;
        renderMarker(targetPin);
      }
    } else if (contextMenuTargetLatLng) {
      // Creating new pin
      const newPin: PinData = {
        id: `pin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        lat: contextMenuTargetLatLng.lat,
        lng: contextMenuTargetLatLng.lng,
        label,
        color,
      };
      pins.push(newPin);
      renderMarker(newPin);
      adjustViewport();
    }

    savePinsToUrl(pins);
    closeModal();
  });

  // Context menu actions
  menuAddPin.addEventListener("click", () => {
    openModal("add");
  });

  menuEditPin.addEventListener("click", () => {
    if (!contextMenuTargetPinId) return;
    const pin = pins.find((p) => p.id === contextMenuTargetPinId);
    if (pin) openModal("edit", pin);
  });

  menuDeletePin.addEventListener("click", () => {
    if (!contextMenuTargetPinId) return;
    const targetId = contextMenuTargetPinId;
    hideContextMenu();

    const marker = markerInstances.get(targetId);
    if (marker) {
      marker.remove();
      markerInstances.delete(targetId);
    }
    pins = pins.filter((p) => p.id !== targetId);
    savePinsToUrl(pins);
    adjustViewport();
  });

  // Map right click listener
  map.on("contextmenu", (e: L.LeafletMouseEvent) => {
    showMapContextMenu(e.containerPoint.x, e.containerPoint.y, e.latlng.lat, e.latlng.lng);
  });

  // Close context menu on general click
  window.addEventListener("click", (e) => {
    if (!contextMenu.contains(e.target as Node)) {
      hideContextMenu();
    }
  });

  window.addEventListener("contextmenu", (e) => {
    if (!mapElement.contains(e.target as Node)) {
      hideContextMenu();
    }
  });
}

// Start app once DOM content is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initApp().catch((err) => console.error("map_points.entry.ts init error:", err));
  });
} else {
  initApp().catch((err) => console.error("map_points.entry.ts init error:", err));
}
