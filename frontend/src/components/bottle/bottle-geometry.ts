import { BufferGeometry, Float32BufferAttribute } from 'three';

// Relative dimensions inferred from references/bottle/{1..5}.png, not a CAD scan.
// Y runs from the feet to the neck; the cap brings total height to ~4 units.
export const BOTTLE_CENTER = 1.99;
export const OIL_LEVEL = 3.06;
const SIDES = 96;
const BODY_START = .285;
const NECK_TOP = 3.76;
const WALL = .010;

// Refined profile based on references 1-5:
// Uniform cylinder body (r ≈ .520), smooth organic shoulder taper, narrow neck.
const profile = [
  [.285, .512], [.36, .520], [.54, .520], [1.4, .520], [1.8, .520],
  [2.3, .520], [2.58, .520], [2.76, .502], [2.98, .445], [3.20, .350],
  [3.40, .256], [3.54, .210], [3.64, .205], [3.76, .206],
];

function silhouette(y: number) {
  let i = 0;
  while (i < profile.length - 2 && profile[i + 1][0] < y) i++;
  const [a, b] = [profile[i], profile[i + 1]];
  const previous = profile[Math.max(0, i - 1)];
  const next = profile[Math.min(profile.length - 1, i + 2)];
  const t = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0])));
  const m0 = (b[1] - previous[1]) / (b[0] - previous[0]) * (b[0] - a[0]);
  const m1 = (next[1] - a[1]) / (next[0] - a[0]) * (b[0] - a[0]);
  return (2 * t ** 3 - 3 * t * t + 1) * a[1] + (t ** 3 - 2 * t * t + t) * m0
    + (-2 * t ** 3 + 3 * t * t) * b[1] + (t ** 3 - t * t) * m1;
}

function radius(y: number, theta: number) {
  let r = silhouette(y);
  // Ergonomic lower-body grip ribs: 4 smooth curved wave grooves (photos 1, 2, 5)
  // 2-fold wave matches human front/back hand grip
  for (const center of [.62, .94, 1.26, 1.58]) {
    const wave = .038 * Math.cos(2 * theta);
    const distance = y - center - wave;
    r -= .019 * Math.exp(-((distance / .036) ** 2));
  }
  // Subtle circular reinforcement rings on upper body (photos 1, 2)
  for (const center of [1.86, 2.08, 2.30, 2.50]) {
    r -= .009 * Math.exp(-(((y - center) / .022) ** 2));
  }
  // PET support collar (blow-mold preform flange) below tamper band
  r += .036 * Math.exp(-(((y - 3.635) / .016) ** 2));
  return r;
}

type Ring = (theta: number) => [radius: number, height: number];

function surface(rings: Ring[], bottom: number, top: number, sides = SIDES) {
  const vertices = [0, bottom, 0];
  const indices: number[] = [];
  rings.forEach(ring => {
    for (let j = 0; j < sides; j++) {
      const theta = j / sides * Math.PI * 2;
      const [r, y] = ring(theta);
      vertices.push(r * Math.cos(theta), y, r * Math.sin(theta));
    }
  });
  const last = vertices.length / 3;
  vertices.push(0, top, 0);
  for (let j = 0; j < sides; j++) {
    const next = (j + 1) % sides;
    indices.push(0, 1 + j, 1 + next);
    for (let i = 0; i < rings.length - 1; i++) {
      const a = 1 + i * sides + j, b = 1 + i * sides + next;
      indices.push(a, a + sides, b, b, a + sides, b + sides);
    }
    const offset = 1 + (rings.length - 1) * sides;
    indices.push(offset + j, last, offset + next);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function vessel(isOil: boolean) {
  const rings: Ring[] = [];
  const inset = isOil ? WALL : 0;
  const lift = isOil ? .018 : 0;
  // Continuous 5-foot petaloid base with recessed central push-up (photos 3, 5)
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    rings.push(theta => {
      const lobe = .5 + .5 * Math.cos(5 * theta);
      return [
        (.512 - inset) * t * (1 - .05 * Math.sin(Math.PI * t) * (1 - lobe)),
        .24 + .045 * t - .268 * Math.sin(Math.PI * (t ** 2.6)) * (.42 + .58 * lobe) + lift,
      ];
    });
  }
  const top = isOil ? OIL_LEVEL : NECK_TOP;
  const rows = Math.ceil((top - BODY_START - lift) / .016);
  for (let i = 1; i <= rows; i++) {
    const y = BODY_START + lift + (top - BODY_START - lift) * i / rows;
    rings.push(theta => [radius(y, theta) - inset, y]);
  }
  if (isOil) {
    // Realistic meniscus curvature at the liquid surface
    for (const [scale, drop] of [[.992, .002], [.976, .005], [.94, .007], [.6, .007]]) {
      rings.push(theta => [(radius(top, theta) - inset) * scale, top - drop]);
    }
  }
  return surface(rings, .24 + lift, top - (isOil ? .007 : 0));
}

export function createBottleGeometry() { return vessel(false); }
export function createOilGeometry() { return vessel(true); }

export function createCapGeometry() {
  const points = [
    [.218, 3.715], [.235, 3.718], [.238, 3.73],
    [.238, 3.76], [.238, 3.82], [.238, 3.88], [.238, 3.93],
    [.235, 3.96], [.225, 3.978], [.205, 3.985], [.12, 3.985], [.08, 3.982],
  ];
  const RIB_COUNT = 72;
  const rings: Ring[] = points.map(([r, y]) => theta => {
    const isRibbed = y >= 3.728 && y <= 3.935;
    const flute = Math.max(0, Math.cos(RIB_COUNT * theta));
    const rib = isRibbed ? .0038 * flute : 0;
    return [r + rib, y];
  });
  return surface(rings, 3.715, 3.985, 288);
}
