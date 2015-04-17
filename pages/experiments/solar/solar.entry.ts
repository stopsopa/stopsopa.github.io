import "./solar.entry.css";

/**
 * 3D Vector interface representing positions and directions in space.
 */
interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Configuration and state for individual planets in the solar simulation.
 */
interface PlanetConfig {
  name: string;
  radius: number;
  color: string;
  trailColor: string;
  distance: number;
  orbitalSpeed: number;
  initialAngle: number;
  inclination: number; // inclination relative to solar system plane in radians
}

/**
 * Historical trail point to render helical ribbon behind moving bodies.
 */
interface TrailPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Planet runtime instance.
 */
interface PlanetInstance extends PlanetConfig {
  currentAngle: number;
  currentPos: Vec3;
  trail: TrailPoint[];
}

/**
 * Moon configuration for celestial satellites.
 */
interface MoonConfig {
  name: string;
  planetName: string;
  radius: number;
  color: string;
  trailColor: string;
  distance: number;
  orbitalSpeed: number; // orbital speed relative to parent planet
  inclination: number;
  initialAngle: number;
}

/**
 * Moon runtime instance.
 */
interface MoonInstance extends MoonConfig {
  currentAngle: number;
  currentPos: Vec3;
  trail: TrailPoint[];
}

/**
 * Star field background particle.
 */
interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
}

/**
 * Camera controller state for 3D orbital projection.
 */
interface Camera {
  yaw: number;
  pitch: number;
  distance: number;
  target: Vec3;
}

const canvas = document.getElementById("solar-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

// Simulation parameters
let isPaused = false;
let simulationSpeed = 1.0;
let sunForwardSpeed = 1.5;
let maxTrailLength = 240;
let cameraMode: "follow" | "side" | "top" = "follow";
let showGalaxy = true;

/**
 * Sun flight direction in the ecliptic coordinate system:
 *   Azimuth: rotation around Y (vertical) axis — 0° = along +Z
 *   Elevation: angle above/below the ecliptic X-Z plane
 *
 * Real value: galactic plane is ~60° tilted from ecliptic, so 60° elevation
 * makes the sun fly out-of-plane and produces the beautiful helix vortex.
 */
let flightAzimuthDeg = 0;
let flightElevationDeg = 60;

/** Recomputes FORWARD_DIR from current azimuth & elevation. */
function computeForwardDir(): Vec3 {
  const az = (flightAzimuthDeg * Math.PI) / 180;
  const el = (flightElevationDeg * Math.PI) / 180;
  return {
    x: Math.cos(el) * Math.sin(az),
    y: Math.sin(el),
    z: Math.cos(el) * Math.cos(az),
  };
}

/**
 * Galactic plane basis vectors (for placing galaxy stars):
 * GALACTIC_POLE = normal to galactic plane (~60.2° from ecliptic Y axis)
 * gU = tangential direction (galactic orbit toward Cygnus), roughly +X
 * gV = radial outward from galactic center
 */
const tiltRad = (60.2 * Math.PI) / 180;
const GALACTIC_POLE: Vec3 = {
  x: 0,
  y: Math.cos(tiltRad),
  z: Math.sin(tiltRad),
};

const gU: Vec3 = { x: 1, y: 0, z: 0 };
const gV: Vec3 = {
  x: 0,
  y: GALACTIC_POLE.z,
  z: -GALACTIC_POLE.y,
};

// Sun world position
let sunPos: Vec3 = { x: 0, y: 0, z: 0 };
let sunTrail: TrailPoint[] = [];

// Earth orbital period as baseline (1 Earth Year = 365.25 days)
// Base angular speed for Earth (radians per tick)
const BASE_EARTH_SPEED = 0.025;

/**
 * Real orbital periods in Earth years:
 * Mercury:  0.2408467 yr (~87.97 days)
 * Venus:    0.61519726 yr (~224.7 days)
 * Earth:    1.0 yr (~365.25 days)
 * Mars:     1.8808158 yr (~687 days)
 * Jupiter:  11.862615 yr (~4,333 days) -> Earth circles ~11.86 times per 1 Jupiter orbit
 * Saturn:   29.447498 yr (~10,759 days)
 * Uranus:   84.016846 yr (~30,687 days)
 * Neptune:  164.79132 yr (~60,190 days)
 */

// Planet configurations scaled for aesthetic clarity in simulation
const PLANETS_CONFIG: PlanetConfig[] = [
  {
    name: "Mercury",
    radius: 3.5,
    color: "#c2beb8",
    trailColor: "rgba(194, 190, 184, ",
    distance: 65,
    orbitalSpeed: BASE_EARTH_SPEED / 0.2408467,
    initialAngle: 0.2,
    inclination: 0.12,
  },
  {
    name: "Venus",
    radius: 5.5,
    color: "#e5c07b",
    trailColor: "rgba(229, 192, 123, ",
    distance: 105,
    orbitalSpeed: BASE_EARTH_SPEED / 0.61519726,
    initialAngle: 1.1,
    inclination: 0.05,
  },
  {
    name: "Earth",
    radius: 6.0,
    color: "#61afef",
    trailColor: "rgba(97, 175, 239, ",
    distance: 155,
    orbitalSpeed: BASE_EARTH_SPEED / 1.0,
    initialAngle: 2.5,
    inclination: 0.0,
  },
  {
    name: "Mars",
    radius: 4.5,
    color: "#e06c75",
    trailColor: "rgba(224, 108, 117, ",
    distance: 210,
    orbitalSpeed: BASE_EARTH_SPEED / 1.8808158,
    initialAngle: 4.1,
    inclination: 0.03,
  },
  {
    name: "Jupiter",
    radius: 13.0,
    color: "#d19a66",
    trailColor: "rgba(209, 154, 102, ",
    distance: 310,
    orbitalSpeed: BASE_EARTH_SPEED / 11.862615,
    initialAngle: 0.8,
    inclination: 0.02,
  },
  {
    name: "Saturn",
    radius: 10.5,
    color: "#f0d38d",
    trailColor: "rgba(240, 211, 141, ",
    distance: 420,
    orbitalSpeed: BASE_EARTH_SPEED / 29.447498,
    initialAngle: 3.3,
    inclination: 0.04,
  },
  {
    name: "Uranus",
    radius: 8.0,
    color: "#56b6c2",
    trailColor: "rgba(86, 182, 194, ",
    distance: 530,
    orbitalSpeed: BASE_EARTH_SPEED / 84.016846,
    initialAngle: 5.2,
    inclination: 0.01,
  },
  {
    name: "Neptune",
    radius: 7.5,
    color: "#4c78dd",
    trailColor: "rgba(76, 120, 221, ",
    distance: 630,
    orbitalSpeed: BASE_EARTH_SPEED / 164.79132,
    initialAngle: 2.1,
    inclination: 0.03,
  },
];

// Initialize planet instances
const planets: PlanetInstance[] = PLANETS_CONFIG.map((cfg) => ({
  ...cfg,
  currentAngle: cfg.initialAngle,
  currentPos: { x: 0, y: 0, z: 0 },
  trail: [],
}));

/**
 * Major moons configuration:
 * Moon (Earth): ~27.3 days orbital period (~13.37 orbits per 1 Earth year)
 * Galilean moons (Jupiter):
 *   Io: 1.77 days
 *   Europa: 3.55 days
 *   Ganymede: 7.15 days
 *   Callisto: 16.69 days
 * Titan (Saturn): 15.95 days
 * Titania (Uranus): 8.7 days
 * Triton (Neptune): 5.88 days (retrograde orbit)
 */
const MOONS_CONFIG: MoonConfig[] = [
  // Earth
  {
    name: "Moon",
    planetName: "Earth",
    radius: 1.8,
    color: "#e0dedb",
    trailColor: "rgba(224, 222, 219, ",
    distance: 14,
    orbitalSpeed: BASE_EARTH_SPEED * 13.37,
    inclination: 0.09,
    initialAngle: 0.5,
  },
  // Jupiter (Galilean moons)
  {
    name: "Io",
    planetName: "Jupiter",
    radius: 1.5,
    color: "#e5c158",
    trailColor: "rgba(229, 193, 88, ",
    distance: 20,
    orbitalSpeed: BASE_EARTH_SPEED * (365.25 / 1.77) * 0.1, // scaled for smooth rendering
    inclination: 0.01,
    initialAngle: 0.2,
  },
  {
    name: "Europa",
    planetName: "Jupiter",
    radius: 1.4,
    color: "#b9cbe0",
    trailColor: "rgba(185, 203, 224, ",
    distance: 26,
    orbitalSpeed: BASE_EARTH_SPEED * (365.25 / 3.55) * 0.1,
    inclination: 0.02,
    initialAngle: 1.6,
  },
  {
    name: "Ganymede",
    planetName: "Jupiter",
    radius: 2.1,
    color: "#9e968c",
    trailColor: "rgba(158, 150, 140, ",
    distance: 33,
    orbitalSpeed: BASE_EARTH_SPEED * (365.25 / 7.15) * 0.1,
    inclination: 0.01,
    initialAngle: 3.0,
  },
  {
    name: "Callisto",
    planetName: "Jupiter",
    radius: 1.9,
    color: "#7b7268",
    trailColor: "rgba(123, 114, 104, ",
    distance: 40,
    orbitalSpeed: BASE_EARTH_SPEED * (365.25 / 16.69) * 0.1,
    inclination: 0.03,
    initialAngle: 4.8,
  },
  // Saturn
  {
    name: "Titan",
    planetName: "Saturn",
    radius: 2.1,
    color: "#e8aa53",
    trailColor: "rgba(232, 170, 83, ",
    distance: 28,
    orbitalSpeed: BASE_EARTH_SPEED * (365.25 / 15.95) * 0.12,
    inclination: 0.06,
    initialAngle: 2.4,
  },
  // Uranus
  {
    name: "Titania",
    planetName: "Uranus",
    radius: 1.5,
    color: "#b8c9cb",
    trailColor: "rgba(184, 201, 203, ",
    distance: 18,
    orbitalSpeed: BASE_EARTH_SPEED * (365.25 / 8.7) * 0.1,
    inclination: 0.1,
    initialAngle: 1.1,
  },
  // Neptune
  {
    name: "Triton",
    planetName: "Neptune",
    radius: 1.6,
    color: "#cad7e6",
    trailColor: "rgba(202, 215, 230, ",
    distance: 18,
    orbitalSpeed: -BASE_EARTH_SPEED * (365.25 / 5.88) * 0.1, // Retrograde
    inclination: -0.28,
    initialAngle: 3.7,
  },
];

// Initialize moon instances
const moons: MoonInstance[] = MOONS_CONFIG.map((cfg) => ({
  ...cfg,
  currentAngle: cfg.initialAngle,
  currentPos: { x: 0, y: 0, z: 0 },
  trail: [],
}));

// Star background field - all galaxy stars stored as simple Star dots
const stars: Star[] = [];
const BACKGROUND_STAR_COUNT = 350;
const GALAXY_STAR_COUNT = 2000;

/**
 * Initialises background stars and Milky Way spiral-arm dots.
 * No gradients/clouds — pure dots for performance.
 *
 * Galaxy layout (galactic plane coords):
 *   gU = tangential (orbital direction, +X axis)
 *   gV = radial outward from galactic center
 *   The Sun sits at origin; galactic center is R_SUN along -gV.
 *   R_SUN = 8000 (arbitrary units matching solar system scale well)
 */
function initStars(): void {
  stars.length = 0;

  const R_SUN = 8000;
  const GC_U = 0;
  const GC_V = -R_SUN;

  const toWorld = (u: number, v: number, w: number): Vec3 => ({
    x: gU.x * u + gV.x * v + GALACTIC_POLE.x * w,
    y: gU.y * u + gV.y * v + GALACTIC_POLE.y * w,
    z: gU.z * u + gV.z * v + GALACTIC_POLE.z * w,
  });

  // 1. Isotropic background stars (very faint)
  for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
    const cosTheta = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const d = 40000 + Math.random() * 30000;
    stars.push({
      x: d * sinTheta * Math.cos(phi),
      y: d * sinTheta * Math.sin(phi),
      z: d * cosTheta,
      size: Math.random() * 1.0 + 0.4,
      alpha: Math.random() * 0.35 + 0.1,
    });
  }

  // 2. Galactic core bulge (dense cluster around Sagittarius A*)
  for (let i = 0; i < 300; i++) {
    // Sum of 3 randoms gives roughly Gaussian distribution
    const u = (Math.random() + Math.random() + Math.random() - 1.5) * 3000;
    const v = (Math.random() + Math.random() + Math.random() - 1.5) * 3000;
    const w = (Math.random() + Math.random() - 1.0) * 1500;
    const pos = toWorld(GC_U + u, GC_V + v, w);
    stars.push({
      x: pos.x,
      y: pos.y,
      z: pos.z,
      size: Math.random() * 1.4 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
    });
  }

  // 3. Four logarithmic spiral arms
  const ARM_COUNT = 4;
  const spiralB = 0.26;
  const armStars = GALAXY_STAR_COUNT - 300;

  for (let i = 0; i < armStars; i++) {
    const arm = i % ARM_COUNT;
    const armOffset = arm * ((2 * Math.PI) / ARM_COUNT);
    const t = Math.pow(Math.random(), 0.7) * (Math.PI * 3.2);
    const r = 1200 + Math.exp(spiralB * t) * 900;

    const disp = (Math.random() - 0.5) * 0.3;
    const angle = t + armOffset + disp;

    const u = GC_U + Math.cos(angle) * r;
    const v = GC_V + Math.sin(angle) * r;
    const w = (Math.random() - 0.5) * (400 + r * 0.025);

    const pos = toWorld(u, v, w);
    stars.push({
      x: pos.x,
      y: pos.y,
      z: pos.z,
      size: Math.random() * 1.3 + 0.4,
      alpha: Math.random() * 0.4 + 0.12,
    });
  }
}

// Camera orbit controller
const camera: Camera = {
  yaw: 0.45,
  pitch: 0.3,
  distance: 1400,
  target: { x: 0, y: 0, z: 0 },
};

/**
 * Resizes canvas to match client viewport and device pixel ratio.
 */
function handleResize(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
}

window.addEventListener("resize", handleResize);
handleResize();
initStars();

/**
 * Transforms a celestial direction/position to screen coordinate (infinite skybox parallax).
 */
function projectSkybox(point: Vec3): { x: number; y: number; scale: number; visible: boolean } {
  // Normalize vector to place celestial objects on a sphere surrounding the observer
  const dist = Math.hypot(point.x, point.y, point.z);
  if (dist === 0) {
    return { x: 0, y: 0, scale: 0, visible: false };
  }

  // Map to fixed skybox radius (distance 2400)
  const SKY_R = 2400;
  const nx = (point.x / dist) * SKY_R;
  const ny = (point.y / dist) * SKY_R;
  const nz = (point.z / dist) * SKY_R;

  // Yaw rotation around Y axis
  const cosY = Math.cos(camera.yaw);
  const sinY = Math.sin(camera.yaw);
  const x1 = nx * cosY - nz * sinY;
  const z1 = nx * sinY + nz * cosY;

  // Pitch rotation around X axis
  const cosP = Math.cos(camera.pitch);
  const sinP = Math.sin(camera.pitch);
  const y2 = ny * cosP - z1 * sinP;
  const z2 = ny * sinP + z1 * cosP;

  const zCamera = z2 + SKY_R;

  if (zCamera <= 10) {
    return { x: 0, y: 0, scale: 0, visible: false };
  }

  const fov = 900;
  const scale = fov / zCamera;
  const dpr = window.devicePixelRatio || 1;
  const screenX = canvas.width / 2 + x1 * scale * dpr;
  const screenY = canvas.height / 2 - y2 * scale * dpr;

  return { x: screenX, y: screenY, scale, visible: true };
}

/**
 * Transforms a 3D coordinate in world space to 2D screen coordinate.
 */
function project(point: Vec3): { x: number; y: number; scale: number; visible: boolean } {
  // Translate point relative to camera target
  const tx = point.x - camera.target.x;
  const ty = point.y - camera.target.y;
  const tz = point.z - camera.target.z;

  // Yaw rotation around Y axis
  const cosY = Math.cos(camera.yaw);
  const sinY = Math.sin(camera.yaw);
  const x1 = tx * cosY - tz * sinY;
  const z1 = tx * sinY + tz * cosY;

  // Pitch rotation around X axis
  const cosP = Math.cos(camera.pitch);
  const sinP = Math.sin(camera.pitch);
  const y2 = ty * cosP - z1 * sinP;
  const z2 = ty * sinP + z1 * cosP;

  // Distance along Z
  const zCamera = z2 + camera.distance;

  if (zCamera <= 10) {
    return { x: 0, y: 0, scale: 0, visible: false };
  }

  const fov = 900;
  const scale = fov / zCamera;
  const dpr = window.devicePixelRatio || 1;
  const screenX = canvas.width / 2 + x1 * scale * dpr;
  const screenY = canvas.height / 2 - y2 * scale * dpr;

  return { x: screenX, y: screenY, scale, visible: true };
}

/**
 * Updates positions of Sun and all orbiting planets.
 */
function updateSimulation(): void {
  if (isPaused) {
    return;
  }

  // Advance Sun along galactic forward motion vector (recomputed each frame from sliders)
  const fd = computeForwardDir();
  const forwardStep = sunForwardSpeed * simulationSpeed;
  sunPos.x += fd.x * forwardStep;
  sunPos.y += fd.y * forwardStep;
  sunPos.z += fd.z * forwardStep;

  // Record Sun trail point
  sunTrail.push({ ...sunPos });
  if (sunTrail.length > maxTrailLength) {
    sunTrail.shift();
  }

  // Update planets in orbit around moving Sun
  for (const p of planets) {
    p.currentAngle += p.orbitalSpeed * simulationSpeed;

    // Helical coordinate calculation:
    // Orbit is in the Sun's orbital plane (X-Z plane with inclination)
    const localX = Math.cos(p.currentAngle) * p.distance;
    const localZ = Math.sin(p.currentAngle) * p.distance;
    const localY = Math.sin(p.currentAngle) * Math.sin(p.inclination) * (p.distance * 0.25);

    // Planet position = Sun position + relative orbital offset
    p.currentPos = {
      x: sunPos.x + localX,
      y: sunPos.y + localY,
      z: sunPos.z + localZ,
    };

    p.trail.push({ ...p.currentPos });
    if (p.trail.length > maxTrailLength) {
      p.trail.shift();
    }
  }

  // Update moons in orbit around their respective parent planets
  const planetMap = new Map(planets.map((p) => [p.name, p]));
  for (const m of moons) {
    const parent = planetMap.get(m.planetName);
    if (!parent) {
      continue;
    }

    m.currentAngle += m.orbitalSpeed * simulationSpeed;

    const mLocalX = Math.cos(m.currentAngle) * m.distance;
    const mLocalZ = Math.sin(m.currentAngle) * m.distance;
    const mLocalY = Math.sin(m.currentAngle) * Math.sin(m.inclination) * (m.distance * 0.4);

    m.currentPos = {
      x: parent.currentPos.x + mLocalX,
      y: parent.currentPos.y + mLocalY,
      z: parent.currentPos.z + mLocalZ,
    };

    m.trail.push({ ...m.currentPos });
    // Keep moon trails slightly shorter for visual crispness
    if (m.trail.length > Math.min(80, Math.floor(maxTrailLength * 0.4))) {
      m.trail.shift();
    }
  }

  // Camera smooth targeting
  camera.target.x += (sunPos.x - camera.target.x) * 0.1;
  camera.target.y += (sunPos.y - camera.target.y) * 0.1;
  camera.target.z += (sunPos.z - camera.target.z) * 0.1;
}

/**
 * Renders background and galaxy stars as simple dots — no gradients, no clouds.
 */
function renderStars(): void {
  const dpr = window.devicePixelRatio || 1;

  // Background stars always visible
  for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
    const s = stars[i];
    const p = projectSkybox({ x: s.x, y: s.y, z: s.z });
    if (p.visible) {
      ctx.fillStyle = `rgba(235, 240, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, s.size * dpr), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!showGalaxy) {
    return;
  }

  // Galaxy stars — drawn as simple dots
  for (let i = BACKGROUND_STAR_COUNT; i < stars.length; i++) {
    const s = stars[i];
    const p = projectSkybox({ x: s.x, y: s.y, z: s.z });
    if (p.visible) {
      ctx.fillStyle = `rgba(230, 238, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, s.size * dpr), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draws a helical ribbon trail for a celestial body.
 */
function renderTrail(trail: TrailPoint[], colorBase: string, width: number): void {
  if (trail.length < 2) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  for (let i = 0; i < trail.length - 1; i++) {
    const pt1 = project(trail[i]);
    const pt2 = project(trail[i + 1]);

    if (pt1.visible && pt2.visible) {
      const alpha = ((i + 1) / trail.length) * 0.7;
      ctx.strokeStyle = `${colorBase}${alpha})`;
      ctx.lineWidth = Math.max(1, width * pt2.scale * dpr);
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    }
  }
}

/**
 * Main draw loop.
 */
function render(): void {
  ctx.fillStyle = "#03050d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderStars();

  // Draw Sun trail
  renderTrail(sunTrail, "rgba(255, 220, 90, ", 4);

  // Draw planet trails (the famous helical vortex spirals)
  for (const p of planets) {
    renderTrail(p.trail, p.trailColor, 2);
  }

  // Draw moon trails (weaving sub-helices)
  for (const m of moons) {
    renderTrail(m.trail, m.trailColor, 1);
  }

  // Draw Sun with glowing radial corona
  const sunProj = project(sunPos);
  const dpr = window.devicePixelRatio || 1;
  if (sunProj.visible) {
    const sunRadius = 24 * sunProj.scale * dpr;

    // Glowing outer corona
    const gradient = ctx.createRadialGradient(
      sunProj.x,
      sunProj.y,
      Math.max(1, sunRadius * 0.3),
      sunProj.x,
      sunProj.y,
      Math.max(2, sunRadius * 3.5)
    );
    gradient.addColorStop(0, "rgba(255, 235, 120, 1)");
    gradient.addColorStop(0.35, "rgba(255, 170, 40, 0.7)");
    gradient.addColorStop(0.7, "rgba(255, 80, 10, 0.25)");
    gradient.addColorStop(1, "rgba(255, 50, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sunProj.x, sunProj.y, Math.max(2, sunRadius * 3.5), 0, Math.PI * 2);
    ctx.fill();

    // Solid bright core
    ctx.fillStyle = "#fff8e7";
    ctx.beginPath();
    ctx.arc(sunProj.x, sunProj.y, Math.max(2, sunRadius), 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw planets and labels
  for (const p of planets) {
    const proj = project(p.currentPos);
    if (proj.visible) {
      const pRadius = Math.max(2, p.radius * proj.scale * dpr);

      // Planet body
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, pRadius, 0, Math.PI * 2);
      ctx.fill();

      // Saturn rings
      if (p.name === "Saturn") {
        ctx.strokeStyle = "rgba(240, 211, 141, 0.75)";
        ctx.lineWidth = Math.max(1, 2 * proj.scale * dpr);
        ctx.beginPath();
        ctx.ellipse(proj.x, proj.y, pRadius * 2.3, pRadius * 0.7, -0.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Planet label
      ctx.fillStyle = "#9cb3d1";
      ctx.font = `${Math.max(10, 11 * dpr)}px sans-serif`;
      ctx.fillText(p.name, proj.x + pRadius + 5, proj.y + 4);
    }
  }

  // Draw moons
  for (const m of moons) {
    const proj = project(m.currentPos);
    if (proj.visible) {
      const mRadius = Math.max(1.2, m.radius * proj.scale * dpr);

      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, mRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Main animation loop.
 */
function animate(): void {
  updateSimulation();
  render();
  requestAnimationFrame(animate);
}

// User interactions: Mouse drag to rotate and wheel to zoom
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    camera.yaw -= dx * 0.006;
    camera.pitch = Math.max(-1.45, Math.min(1.45, camera.pitch - dy * 0.006));
  }
});

// Wheel zoom
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    camera.distance = Math.max(300, Math.min(4500, camera.distance + e.deltaY * 1.5));
  },
  { passive: false }
);

// UI controls
const speedRange = document.getElementById("speed-range") as HTMLInputElement;
const forwardSpeedRange = document.getElementById("sun-forward-speed") as HTMLInputElement;
const trailLengthRange = document.getElementById("trail-length") as HTMLInputElement;
const btnTogglePause = document.getElementById("btn-toggle-pause") as HTMLButtonElement;
const btnResetCam = document.getElementById("btn-reset-cam") as HTMLButtonElement;
const btnCamFollow = document.getElementById("btn-cam-follow") as HTMLButtonElement;
const btnCamSide = document.getElementById("btn-cam-side") as HTMLButtonElement;
const btnCamTop = document.getElementById("btn-cam-top") as HTMLButtonElement;

speedRange?.addEventListener("input", () => {
  simulationSpeed = parseFloat(speedRange.value);
});

forwardSpeedRange?.addEventListener("input", () => {
  sunForwardSpeed = parseFloat(forwardSpeedRange.value);
});

const flightElevationRange = document.getElementById("flight-elevation") as HTMLInputElement;
const flightElevationVal = document.getElementById("flight-elevation-val") as HTMLSpanElement;
const flightAzimuthRange = document.getElementById("flight-azimuth") as HTMLInputElement;
const flightAzimuthVal = document.getElementById("flight-azimuth-val") as HTMLSpanElement;

flightElevationRange?.addEventListener("input", () => {
  flightElevationDeg = parseFloat(flightElevationRange.value);
  if (flightElevationVal) flightElevationVal.textContent = `${flightElevationDeg}°`;
});

flightAzimuthRange?.addEventListener("input", () => {
  flightAzimuthDeg = parseFloat(flightAzimuthRange.value);
  if (flightAzimuthVal) flightAzimuthVal.textContent = `${flightAzimuthDeg}°`;
});

trailLengthRange?.addEventListener("input", () => {
  maxTrailLength = parseInt(trailLengthRange.value, 10);
});

btnTogglePause?.addEventListener("click", () => {
  isPaused = !isPaused;
  btnTogglePause.textContent = isPaused ? "Resume" : "Pause";
});

btnResetCam?.addEventListener("click", () => {
  camera.yaw = 0.45;
  camera.pitch = 0.3;
  camera.distance = 1400;
});

function setActiveCamBtn(btn: HTMLButtonElement): void {
  btnCamFollow.classList.remove("active");
  btnCamSide.classList.remove("active");
  btnCamTop.classList.remove("active");
  btn.classList.add("active");
}

btnCamFollow?.addEventListener("click", () => {
  cameraMode = "follow";
  setActiveCamBtn(btnCamFollow);
  camera.yaw = 0.45;
  camera.pitch = 0.3;
  camera.distance = 1400;
});

btnCamSide?.addEventListener("click", () => {
  cameraMode = "side";
  setActiveCamBtn(btnCamSide);
  // View from perpendicular angle to highlight helical vortex trails
  camera.yaw = 1.57;
  camera.pitch = 0.05;
  camera.distance = 1700;
});

btnCamTop?.addEventListener("click", () => {
  cameraMode = "top";
  setActiveCamBtn(btnCamTop);
  // Heliocentric top-down look
  camera.yaw = 0;
  camera.pitch = 1.55;
  camera.distance = 1600;
});

// Galaxy toggle checkbox
const chkGalaxy = document.getElementById("chk-galaxy") as HTMLInputElement;
chkGalaxy?.addEventListener("change", () => {
  showGalaxy = chkGalaxy.checked;
});

// Kick off simulation loop
requestAnimationFrame(animate);
