/**
 * Builds the 3D home-office room out of PLACEHOLDER primitives (boxes, planes,
 * cylinders, a couple of small frusta). The plan is to replace this procedural
 * geometry with an imported GLTF model later — keep that swap in mind:
 *
 * Everything outside this file only relies on the returned handles and the
 * exported constants. A future GLTF version just needs to load the model
 * and return the same shape ({ tvGroup, tvBody }) and keep the constants.
 *
 * The room (8×8m, walls at ±4, ceiling 3.2m): a low media console on the TV
 * wall (−Z) with the CRT on it, a plain sofa in the middle facing it, an empty
 * desk + chair against the back wall (+Z), big floor-to-ceiling windows on the
 * left (−X) and back (+Z) walls looking onto a golden-hour sky, and plants
 * scattered around (a cluster to the right of the TV especially).
 *
 * Note: the TV has no front face here. Its screen/controls/cabinet front IS
 * the real DOM website, projected into the scene by Scene.tsx via
 * CSS3DRenderer. This file provides the CRT *cabinet + rear tube shell* so the
 * set reads as a real CRT from the sides and back; the wooden body box behind
 * the DOM bezel is sized at runtime from the measured cabinet.
 */
import * as THREE from 'three';

/** Walkable area (room is 6.4×6.4m, walls at ±3.2) */
export const BOUNDS = { minX: -2.72, maxX: 2.72, minZ: -2.56, maxZ: 2.48 };
export const EYE_HEIGHT = 1.6;

/** Where the camera ends up after "getting off the couch" */
export const STANDING_SPOT = new THREE.Vector3(0, EYE_HEIGHT, 0.56);

/** World units per CSS pixel: the 920px-wide DOM cabinet ≈ 1.1m */
export const WORLD_PER_PX = 1.1 / 920;
/** Z of the TV's front plane (the DOM face) — the wall is at −3.2 */
export const TV_FRONT_Z = -2.68;
/** Top of the TV stand: the DOM TV's feet rest here */
export const STAND_TOP_Y = 0.5;

/** FOV at the closeup (website) framing; widens while walking */
export const CLOSEUP_FOV = 55;
export const WALKING_FOV = 70;

// Room shrunk 20% in width/depth (8→6.4) to feel more cramped; interior objects
// keep their real size but were moved in proportionally. Ceiling height is
// unchanged.
const ROOM_HALF = 3.2;
const CEILING_Y = 3.2;
/** Wall thickness — walls are solid slabs (not planes) so the shell is
 *  watertight: corners and floor/ceiling joints overlap, no light leaks */
const WALL_T = 0.15;

const COL = {
  floor: 0xb89066,
  ceiling: 0xf3efe8,
  wall: 0xe9e3d6,
  baseboard: 0xcdc6b8,
  rug: 0x9a8f78,
  couch: 0xc4bdac,
  couchDark: 0xb1a995,
  couchLeg: 0x2c241c,
  console: 0x6f5236,
  consoleLeg: 0x241a12,
  crtCabinet: 0x46362a,
  crtShell: 0x29211a,
  deskTop: 0xbb9466,
  deskLeg: 0x26211b,
  chairFabric: 0x3a3b40,
  chairMetal: 0x8a8c90,
  potTerra: 0xb16a43,
  potStone: 0xd8d2c4,
  potDark: 0x33312c,
  leaf: 0x537e3b,
  leafDark: 0x3f6630,
  leafLight: 0x6f9a4a,
  frame: 0x202024,
} as const;

function box(
  w: number,
  h: number,
  d: number,
  color: number,
  opts: { roughness?: number; metalness?: number } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(
  rTop: number,
  rBottom: number,
  h: number,
  color: number,
  opts: { roughness?: number; metalness?: number; segments?: number } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, opts.segments ?? 18),
    new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.8,
      metalness: opts.metalness ?? 0,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function sphere(
  r: number,
  color: number,
  opts: { roughness?: number; metalness?: number; flatShading?: boolean } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 16, 12),
    new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.6,
      metalness: opts.metalness ?? 0,
      flatShading: opts.flatShading ?? false,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ── Sky ─────────────────────────────────────────────────────────────────────
// A big inward-facing sphere with a golden-hour vertical gradient + a soft sun
// glow baked into the shader, plus a few cloud puffs. The room walls occlude it
// everywhere except through the two windows. It ignores scene lights by design.
function addSky(scene: THREE.Scene): THREE.DirectionalLight {
  const sunPosition = new THREE.Vector3(-11, 5.5, 9);

  const skyGeometry = new THREE.SphereGeometry(46, 48, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uHorizon: { value: new THREE.Color(0xffd7a6) },
      uZenith: { value: new THREE.Color(0x3f74c4) },
      uGround: { value: new THREE.Color(0xc9b89a) },
      uSunColor: { value: new THREE.Color(0xfff1cf) },
      uSunDir: { value: sunPosition.clone().normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform vec3 uHorizon;
      uniform vec3 uZenith;
      uniform vec3 uGround;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      void main() {
        float h = vDir.y;
        vec3 sky = mix(uHorizon, uZenith, smoothstep(0.0, 0.65, h));
        sky = mix(sky, uGround, smoothstep(0.0, -0.25, h));
        // soft atmospheric warmth around the sun (the crisp disc is a real
        // mesh, added below — this is just the haze that surrounds it)
        float sun = max(dot(vDir, uSunDir), 0.0);
        sky += uSunColor * pow(sun, 8.0) * 0.3;
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
  scene.background = new THREE.Color(0x9bbce8);

  // fluffy cumulus clouds, each one procedurally varied so no two look alike:
  // different lobe counts, sizes, horizontal spread, stretch, tilt and a faint
  // warm/cool near-white tint. Flattened bottoms read more cloud-like.
  const cloudGeometry = new THREE.SphereGeometry(1, 16, 12);
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const makeCloud = (scale: number) => {
    const cloud = new THREE.Group();
    // near-white with a subtle warm or cool cast (never greenish)
    const hue = Math.random() < 0.5 ? rand(0.07, 0.12) : rand(0.55, 0.62);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue, rand(0.06, 0.16), rand(0.9, 0.97)),
    });
    const spread = rand(2.0, 3.8);
    const lobes = 5 + Math.floor(rand(0, 4));
    for (let i = 0; i < lobes; i++) {
      const t = lobes === 1 ? 0 : i / (lobes - 1) - 0.5; // −0.5..0.5 along the base
      const r = Math.max(0.35, rand(0.6, 1.0) - Math.abs(t) * 0.7); // fatter middle
      const puff = new THREE.Mesh(cloudGeometry, material);
      puff.position.set(t * spread, rand(-0.1, 0.25), rand(-0.4, 0.4));
      puff.scale.set(r, r * rand(0.6, 0.78), r);
      cloud.add(puff);
    }
    // a few smaller puffs piled on top for height/fluff
    const tops = 1 + Math.floor(rand(0, 3));
    for (let i = 0; i < tops; i++) {
      const r = rand(0.4, 0.7);
      const puff = new THREE.Mesh(cloudGeometry, material);
      puff.position.set(rand(-spread * 0.4, spread * 0.4), rand(0.45, 0.9), rand(-0.3, 0.3));
      puff.scale.set(r, r * 0.7, r);
      cloud.add(puff);
    }
    cloud.scale.set(scale * rand(0.9, 1.25), scale * rand(0.82, 1.08), scale);
    cloud.rotation.y = rand(0, Math.PI * 2);
    return cloud;
  };
  const cloudSpots: Array<[number, number, number, number]> = [
    [-22, 8, -3, 2.0], // x, y, z, scale — out the west window
    [-27, 11, 8, 2.6],
    [-19, 6, 15, 1.6],
    [-24, 9, -13, 1.8],
    [-31, 13, 2, 2.2],
    [4, 9, 23, 2.4], // out the back window
    [-9, 12, 27, 2.8],
    [13, 7, 20, 1.8],
    [19, 10, 11, 2.0],
    [1, 14, 31, 2.2],
    [-15, 15, 18, 1.6], // a couple high overhead
    [9, 16, -6, 1.8],
  ];
  for (const [x, y, z, s] of cloudSpots) {
    const cloud = makeCloud(s);
    cloud.position.set(x, y, z);
    scene.add(cloud);
  }

  // a soft, glowing sun: a radial-gradient sprite (brightest dead centre,
  // fading smoothly out) so it reads as *shining* rather than a hard ringed
  // disc. Depth-tested, so the walls hide it — it only shows through windows.
  const sunDir = sunPosition.clone().normalize();
  const sunCenter = sunDir.clone().multiplyScalar(40);

  const glow = document.createElement('canvas');
  glow.width = glow.height = 128;
  const gctx = glow.getContext('2d')!;
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(255,255,252,1)');
  grad.addColorStop(0.13, 'rgba(255,249,226,1)');
  grad.addColorStop(0.3, 'rgba(255,228,172,0.72)');
  grad.addColorStop(0.6, 'rgba(255,208,150,0.24)');
  grad.addColorStop(1.0, 'rgba(255,200,140,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  const sunTexture = new THREE.CanvasTexture(glow);

  // two layered additive sprites: a tight bright body + a wide soft halo. They
  // both peak at the centre, so it blooms (shines) without any ring.
  for (const size of [7, 18]) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    sprite.position.copy(sunCenter);
    sprite.scale.setScalar(size);
    scene.add(sprite);
  }

  // the golden-hour sun light: warm, low, streaming through the windows.
  // Shadow frustum is sized to enclose the whole room (walls + ceiling) so the
  // walls actually occlude the sunlight instead of it leaking through them.
  const sun = new THREE.DirectionalLight(0xffd9a0, 2.4);
  sun.position.copy(sunPosition);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 45;
  sun.shadow.camera.left = -7.5;
  sun.shadow.camera.right = 7.5;
  sun.shadow.camera.top = 7.5;
  sun.shadow.camera.bottom = -7.5;
  sun.shadow.bias = -0.0004;
  sun.target.position.set(0, 1, 0);
  scene.add(sun);
  scene.add(sun.target);
  return sun;
}

// ── Windowed wall ─────────────────────────────────────────────────────────────
// A full wall hollowed out by a centered floor-to-ceiling opening — side jambs +
// a slim header + a thin sill (all solid slabs) make the hole — then a faint
// glass pane fills it behind a minimal black frame with one transom bar.
//
// Built from solid slabs (like the plain walls) that run past the corners and
// past the floor/ceiling, so the shell stays watertight (no seam light-leaks).
// `normalAxis` is the axis the wall's face points along: 'x' → wall at x=`at`
// spanning Z (a left/right wall); 'z' → wall at z=`at` spanning X (a front/back
// wall). `inward` (+1/−1) points the face toward the room interior. `u` below is
// the along-the-wall coordinate (Z for an 'x' wall, X for a 'z' wall).
function addWindowedWall(
  scene: THREE.Scene,
  wallMaterial: THREE.Material,
  frameMaterial: THREE.Material,
  glassMaterial: THREE.Material,
  opts: { normalAxis: 'x' | 'z'; at: number; inward: 1 | -1; halfWidth: number; sill: number; head: number },
) {
  const { normalAxis, at, inward, halfWidth, sill, head } = opts;
  const rotationY = normalAxis === 'x' ? (inward * Math.PI) / 2 : inward > 0 ? 0 : Math.PI;
  const top = CEILING_Y + 0.15; // overlap the ceiling
  const bottom = -0.15; // overlap the floor

  // a solid wall slab spanning `along` (along the wall) × `height`, centred on
  // the wall line at along-coord u / vertical mid yMid
  const slab = (along: number, height: number, u: number, yMid: number) => {
    const geometry =
      normalAxis === 'x'
        ? new THREE.BoxGeometry(WALL_T, height, along)
        : new THREE.BoxGeometry(along, height, WALL_T);
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    if (normalAxis === 'x') mesh.position.set(at, yMid, u);
    else mesh.position.set(u, yMid, at);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  };

  // jambs: inner edge sits exactly at the opening edge (so the wall never
  // intrudes into the window), outer edge runs 0.2 past the corner for overlap
  const jambLen = ROOM_HALF - halfWidth + 0.2;
  const jambCenter = halfWidth + jambLen / 2; // inner edge = halfWidth, outer = ROOM_HALF + 0.2
  slab(jambLen, top - bottom, -jambCenter, (top + bottom) / 2); // left jamb
  slab(jambLen, top - bottom, jambCenter, (top + bottom) / 2); // right jamb
  slab(halfWidth * 2, top - head, 0, (head + top) / 2); // header (above opening)
  slab(halfWidth * 2, sill - bottom, 0, (sill + bottom) / 2); // sill (below opening)

  // glass pane filling the opening, centred in the wall thickness
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(halfWidth * 2, head - sill), glassMaterial);
  if (normalAxis === 'x') glass.position.set(at, (sill + head) / 2, 0);
  else glass.position.set(0, (sill + head) / 2, at);
  glass.rotation.y = rotationY;
  scene.add(glass);

  // slim frame on the room-facing side of the opening: outer rectangle + transom
  const bar = 0.05;
  const depth = 0.07;
  const frameOffset = WALL_T / 2 + 0.02; // sit just proud of the inner wall face
  const addBar = (centerU: number, centerY: number, lengthU: number, lengthY: number) => {
    const geometry =
      normalAxis === 'x'
        ? new THREE.BoxGeometry(depth, lengthY, lengthU)
        : new THREE.BoxGeometry(lengthU, lengthY, depth);
    const mesh = new THREE.Mesh(geometry, frameMaterial);
    if (normalAxis === 'x') mesh.position.set(at + frameOffset * inward, centerY, centerU);
    else mesh.position.set(centerU, centerY, at + frameOffset * inward);
    mesh.castShadow = true;
    scene.add(mesh);
  };
  const midY = (sill + head) / 2;
  addBar(-halfWidth, midY, bar, head - sill); // left
  addBar(halfWidth, midY, bar, head - sill); // right
  addBar(0, sill, halfWidth * 2, bar); // bottom
  addBar(0, head, halfWidth * 2, bar); // top
  addBar(0, midY, halfWidth * 2, bar); // transom
}

// ── Plant ─────────────────────────────────────────────────────────────────────
// A potted plant. `kind: 'tall'` = upright snake-plant blades; `'bushy'` = a
// leafy mound. Scales as a whole via `scale`.
function makePlant(kind: 'tall' | 'bushy', scale = 1, potColor: number = COL.potTerra): THREE.Group {
  const plant = new THREE.Group();

  const potTop = 0.16 * scale;
  const pot = cylinder(0.15 * scale, 0.11 * scale, 0.3 * scale, potColor, { roughness: 0.9 });
  pot.position.y = 0.15 * scale;
  plant.add(pot);
  const soil = cylinder(0.14 * scale, 0.14 * scale, 0.04 * scale, 0x2e2419, { roughness: 1 });
  soil.position.y = potTop + 0.13 * scale;
  plant.add(soil);
  const soilTop = potTop + 0.14 * scale;

  if (kind === 'tall') {
    const blades = 9;
    for (let i = 0; i < blades; i++) {
      const len = (0.7 + Math.random() * 0.5) * scale;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.05 * scale, len, 0.012 * scale),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? COL.leaf : COL.leafDark,
          roughness: 0.7,
        }),
      );
      blade.castShadow = true;
      const angle = (i / blades) * Math.PI * 2;
      const tilt = 0.18 + Math.random() * 0.22;
      blade.position.set(
        Math.cos(angle) * 0.06 * scale,
        soilTop + len / 2,
        Math.sin(angle) * 0.06 * scale,
      );
      blade.rotation.z = Math.cos(angle) * tilt;
      blade.rotation.x = -Math.sin(angle) * tilt;
      plant.add(blade);
    }
  } else {
    // a bulky leafy mound — randomized lobe count, placement, size and green
    // shade, so every bushy plant is a bit different
    const greens = [COL.leaf, COL.leafDark, COL.leafLight];
    const clumps = 6 + Math.floor(Math.random() * 4); // 6–9 lobes
    const spread = (0.16 + Math.random() * 0.09) * scale;
    for (let i = 0; i < clumps; i++) {
      const r = (0.18 + Math.random() * 0.16) * scale;
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * spread;
      const leaf = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 0),
        new THREE.MeshStandardMaterial({
          color: greens[Math.floor(Math.random() * greens.length)],
          roughness: 0.85,
          flatShading: true,
        }),
      );
      leaf.castShadow = true;
      leaf.position.set(
        Math.cos(angle) * rad,
        soilTop + (0.0 + Math.random() * 0.34) * scale, // sit lower, nestled on the pot (no hover)
        Math.sin(angle) * rad,
      );
      leaf.scale.set(1, 0.8 + Math.random() * 0.25, 1);
      leaf.rotation.y = Math.random() * Math.PI;
      plant.add(leaf);
    }
  }
  return plant;
}

// ── Office chair ───────────────────────────────────────────────────────────────
function makeChair(): THREE.Group {
  const chair = new THREE.Group();
  const seat = box(0.5, 0.08, 0.48, COL.chairFabric, { roughness: 0.7 });
  seat.position.y = 0.5;
  chair.add(seat);
  const backrest = box(0.48, 0.5, 0.07, COL.chairFabric, { roughness: 0.7 });
  backrest.position.set(0, 0.78, -0.22);
  chair.add(backrest);

  const post = cylinder(0.04, 0.04, 0.45, COL.chairMetal, {
    roughness: 0.4,
    metalness: 0.7,
    segments: 12,
  });
  post.position.y = 0.27;
  chair.add(post);

  // 5-star base with castor stubs
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const leg = box(0.34, 0.04, 0.06, COL.chairMetal, { roughness: 0.4, metalness: 0.7 });
    leg.position.set(Math.cos(angle) * 0.16, 0.05, Math.sin(angle) * 0.16);
    leg.rotation.y = -angle;
    chair.add(leg);
    const castor = cylinder(0.035, 0.035, 0.05, COL.consoleLeg, { segments: 10 });
    castor.rotation.x = Math.PI / 2;
    castor.position.set(Math.cos(angle) * 0.31, 0.035, Math.sin(angle) * 0.31);
    chair.add(castor);
  }
  return chair;
}

// ── Chess set ─────────────────────────────────────────────────────────────────
// A board with all 32 pieces in the starting position. Built to be made into a
// real game later, so the structure is queryable rather than baked:
//   • the returned group is named 'chessSet' and carries userData.squareSize +
//     userData.squareCoord(file,rank) → local (x,z) of a square centre
//   • each square tile is in the 'squares' subgroup with userData.square ('e4')
//   • each piece group has userData = { kind:'piece', type, color, square }
// Future logic can getObjectByName('chessSet'), read/maths these, and move the
// piece groups between squareCoord() positions.
const CHESS_SQ = 0.07; // square size (m)
const FILES = 'abcdefgh';
function squareCoord(file: number, rank: number): [number, number] {
  return [(file - 3.5) * CHESS_SQ, (rank - 3.5) * CHESS_SQ];
}

function makeChessPiece(type: string, color: 'white' | 'black'): THREE.Group {
  const g = new THREE.Group();
  const c = color === 'white' ? 0xf2ece0 : 0x2b2622;
  const u = CHESS_SQ;
  const mat = { roughness: 0.5, metalness: 0.05 };
  // shared foot every piece stands on
  const base = cylinder(0.3 * u, 0.4 * u, 0.18 * u, c, mat);
  base.position.y = 0.09 * u;
  g.add(base);
  const collar = cylinder(0.22 * u, 0.3 * u, 0.06 * u, c, mat);
  collar.position.y = 0.21 * u;
  g.add(collar);
  const t = 0.24 * u; // top of the foot

  if (type === 'pawn') {
    const body = cylinder(0.15 * u, 0.24 * u, 0.3 * u, c, mat);
    body.position.y = t + 0.15 * u;
    g.add(body);
    const head = sphere(0.17 * u, c, mat);
    head.position.y = t + 0.42 * u;
    g.add(head);
  } else if (type === 'rook') {
    const body = cylinder(0.22 * u, 0.26 * u, 0.5 * u, c, mat);
    body.position.y = t + 0.25 * u;
    g.add(body);
    const crown = cylinder(0.28 * u, 0.24 * u, 0.1 * u, c, mat);
    crown.position.y = t + 0.55 * u;
    g.add(crown);
    for (let k = 0; k < 4; k++) {
      const angle = (k / 4) * Math.PI * 2;
      const merlon = box(0.09 * u, 0.1 * u, 0.09 * u, c, mat);
      merlon.position.set(Math.cos(angle) * 0.19 * u, t + 0.63 * u, Math.sin(angle) * 0.19 * u);
      g.add(merlon);
    }
  } else if (type === 'knight') {
    const body = cylinder(0.2 * u, 0.26 * u, 0.36 * u, c, mat);
    body.position.y = t + 0.18 * u;
    g.add(body);
    const head = box(0.17 * u, 0.36 * u, 0.42 * u, c, mat);
    head.position.set(0, t + 0.5 * u, 0.05 * u);
    head.rotation.x = -0.45;
    g.add(head);
    const snout = box(0.15 * u, 0.13 * u, 0.22 * u, c, mat);
    snout.position.set(0, t + 0.56 * u, 0.24 * u);
    snout.rotation.x = -0.45;
    g.add(snout);
  } else if (type === 'bishop') {
    const body = cylinder(0.1 * u, 0.26 * u, 0.58 * u, c, mat);
    body.position.y = t + 0.29 * u;
    g.add(body);
    const ball = sphere(0.14 * u, c, mat);
    ball.position.y = t + 0.64 * u;
    g.add(ball);
    const tip = sphere(0.06 * u, c, mat);
    tip.position.y = t + 0.8 * u;
    g.add(tip);
  } else if (type === 'queen') {
    const body = cylinder(0.12 * u, 0.28 * u, 0.68 * u, c, mat);
    body.position.y = t + 0.34 * u;
    g.add(body);
    const crown = cylinder(0.27 * u, 0.16 * u, 0.12 * u, c, mat);
    crown.position.y = t + 0.74 * u;
    g.add(crown);
    const ball = sphere(0.11 * u, c, mat);
    ball.position.y = t + 0.88 * u;
    g.add(ball);
  } else {
    // king
    const body = cylinder(0.13 * u, 0.28 * u, 0.78 * u, c, mat);
    body.position.y = t + 0.39 * u;
    g.add(body);
    const crown = cylinder(0.27 * u, 0.18 * u, 0.12 * u, c, mat);
    crown.position.y = t + 0.84 * u;
    g.add(crown);
    const crossV = box(0.06 * u, 0.22 * u, 0.06 * u, c, mat);
    crossV.position.y = t + 1.04 * u;
    g.add(crossV);
    const crossH = box(0.16 * u, 0.06 * u, 0.06 * u, c, mat);
    crossH.position.y = t + 1.0 * u;
    g.add(crossH);
  }

  g.userData = { kind: 'piece', type, color };
  return g;
}

function makeChessSet(): THREE.Group {
  const set = new THREE.Group();
  set.name = 'chessSet';
  set.userData = { kind: 'chessSet', squareSize: CHESS_SQ, squareCoord };

  // base board with a thin frame
  const span = CHESS_SQ * 8;
  const frame = box(span + 0.05, 0.025, span + 0.05, 0x3a2a1c, { roughness: 0.5 });
  frame.position.y = 0.0125;
  set.add(frame);

  const squares = new THREE.Group();
  squares.name = 'squares';
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const isLight = (file + rank) % 2 === 1;
      const tile = box(CHESS_SQ, 0.012, CHESS_SQ, isLight ? 0xead9b0 : 0x8a5a32, { roughness: 0.6 });
      const [x, z] = squareCoord(file, rank);
      tile.position.set(x, 0.027, z);
      tile.userData = { square: FILES[file] + (rank + 1) };
      squares.add(tile);
    }
  }
  set.add(squares);

  // pieces in the starting position
  const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const place = (file: number, rank: number, type: string, color: 'white' | 'black') => {
    const piece = makeChessPiece(type, color);
    const [x, z] = squareCoord(file, rank);
    piece.position.set(x, 0.033, z);
    piece.userData.square = FILES[file] + (rank + 1);
    set.add(piece);
  };
  for (let file = 0; file < 8; file++) {
    place(file, 0, backRank[file], 'white');
    place(file, 1, 'pawn', 'white');
    place(file, 6, 'pawn', 'black');
    place(file, 7, backRank[file], 'black');
  }
  return set;
}

// ── Painter's easel ───────────────────────────────────────────────────────────
// A tripod easel holding a big canvas. The canvas front face is a separate mesh
// named 'canvasSurface' (in a group named 'canvas') so a paintable texture can
// be wired onto it later. Faces +Z in local space.
function makeEasel(): THREE.Group {
  const g = new THREE.Group();
  const wood = 0x6e4a2a;
  const legLen = 1.7;
  // The two front legs sit at z = 0 (splayed out at the bottom, converging at
  // the top); the canvas hangs well in FRONT of them at z ≈ 0.12, so nothing
  // pokes through. The back leg leans away behind.
  const frontLeft = box(0.045, legLen, 0.045, wood, { roughness: 0.6 });
  frontLeft.position.set(-0.32, legLen / 2, 0);
  frontLeft.rotation.z = -0.16;
  g.add(frontLeft);
  const frontRight = box(0.045, legLen, 0.045, wood, { roughness: 0.6 });
  frontRight.position.set(0.32, legLen / 2, 0);
  frontRight.rotation.z = 0.16;
  g.add(frontRight);
  const backLeg = box(0.045, legLen, 0.045, wood, { roughness: 0.6 });
  backLeg.position.set(0, legLen / 2, -0.34);
  backLeg.rotation.x = 0.34;
  g.add(backLeg);

  // ledge the canvas rests on, protruding forward in front of the legs
  const tray = box(0.66, 0.05, 0.12, wood, { roughness: 0.6 });
  tray.position.set(0, 0.72, 0.11);
  g.add(tray);
  // brace tying the front legs together, behind the canvas
  const brace = box(0.48, 0.04, 0.05, wood, { roughness: 0.6 });
  brace.position.set(0, 1.5, 0);
  g.add(brace);

  // canvas: framed board sitting on the tray, in front of the legs, leaning back
  // just slightly so it never intersects them
  const canvas = new THREE.Group();
  canvas.name = 'canvas';
  const frame = box(0.88, 1.0, 0.045, 0xf3ece0, { roughness: 0.8 });
  canvas.add(frame);
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xfbf8f1, roughness: 0.95 }),
  );
  surface.position.z = 0.024;
  surface.name = 'canvasSurface';
  surface.userData = { paintable: true };
  surface.receiveShadow = true;
  canvas.add(surface);
  canvas.position.set(0, 1.25, 0.12);
  canvas.rotation.x = -0.06;
  g.add(canvas);
  return g;
}

// ── Book (closed, lying flat) ─────────────────────────────────────────────────
// Cream page block between two thin covers, with a spine down the −X edge.
// Built with its bottom at y = 0 so it sits on whatever surface it's placed on.
function makeBook(coverColor: number): THREE.Group {
  const book = new THREE.Group();
  const w = 0.22; // along X
  const d = 0.16; // along Z
  const h = 0.05; // total thickness
  const cover = h * 0.16;
  const pages = box(w * 0.92, h - 2 * cover, d * 0.92, 0xeee3c8, { roughness: 0.9 });
  pages.position.y = h / 2;
  book.add(pages);
  const bottom = box(w, cover, d, coverColor, { roughness: 0.55 });
  bottom.position.y = cover / 2;
  book.add(bottom);
  const top = box(w, cover, d, coverColor, { roughness: 0.55 });
  top.position.y = h - cover / 2;
  book.add(top);
  const spine = box(w * 0.05, h, d, coverColor, { roughness: 0.55 });
  spine.position.set(-w / 2 + w * 0.025, h / 2, 0);
  book.add(spine);
  return book;
}

export function buildRoom(scene: THREE.Scene): { tvGroup: THREE.Group; tvBody: THREE.Mesh } {
  // ── shell: floor, ceiling, solid walls ─────────────────────────────────────
  const wallTop = CEILING_Y + 0.15;
  const wallBottom = -0.15;
  const wallHeight = wallTop - wallBottom;
  const wallMidY = (wallTop + wallBottom) / 2;

  const floorSpan = ROOM_HALF * 2 + 0.4;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(floorSpan, floorSpan),
    new THREE.MeshStandardMaterial({ color: COL.floor, roughness: 0.7 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(floorSpan, floorSpan),
    new THREE.MeshStandardMaterial({ color: COL.ceiling, roughness: 1 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = CEILING_Y;
  ceiling.castShadow = true; // stop the sun leaking straight down through the roof
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: COL.wall, roughness: 0.96 });
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: COL.frame,
    roughness: 0.5,
    metalness: 0.3,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfe2f0,
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.14,
  });

  // solid walls: TV wall (−Z) and right wall (+X). Left (−X) and back (+Z) are
  // windowed. Slabs run 8.3 long (overlapping the corners) and are centred on
  // the wall line, so adjacent walls interlock with no gap.
  const solidWall = (w: number, d: number, x: number, z: number) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), wallMaterial);
    wall.position.set(x, wallMidY, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  };
  const wallSpan = ROOM_HALF * 2 + 0.3;
  solidWall(wallSpan, WALL_T, 0, -ROOM_HALF); // TV wall
  solidWall(WALL_T, wallSpan, ROOM_HALF, 0); // right wall

  // big modern floor-to-ceiling windows (opening scales with the room)
  addWindowedWall(scene, wallMaterial, frameMaterial, glassMaterial, {
    normalAxis: 'x',
    at: -ROOM_HALF, // left wall, faces +X into the room
    inward: 1,
    halfWidth: 1.6,
    sill: 0.12,
    head: 3.0,
  }); // left window
  addWindowedWall(scene, wallMaterial, frameMaterial, glassMaterial, {
    normalAxis: 'z',
    at: ROOM_HALF, // back wall, faces −Z into the room
    inward: -1,
    halfWidth: 1.6,
    sill: 0.12,
    head: 3.0,
  }); // back window (behind the desk)

  // ── rug under the seating area ──────────────────────────────────────────────
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(1.85, 48),
    new THREE.MeshStandardMaterial({ color: COL.rug, roughness: 1 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.scale.x = 1.35;
  rug.position.set(0, 0.01, 0.72);
  rug.receiveShadow = true;
  scene.add(rug);

  // ── sofa (the spot you "got up" from), plain and simple ─────────────────────
  const couch = new THREE.Group();
  const base = box(2.1, 0.32, 0.92, COL.couchDark, { roughness: 0.95 });
  base.position.y = 0.3;
  couch.add(base);
  for (const x of [-0.52, 0.52]) {
    const cushion = box(0.96, 0.22, 0.84, COL.couch, { roughness: 0.95 });
    cushion.position.set(x, 0.52, 0.02);
    couch.add(cushion);
    const backCushion = box(0.96, 0.42, 0.2, COL.couch, { roughness: 0.95 });
    backCushion.position.set(x, 0.68, 0.34);
    couch.add(backCushion);
  }
  for (const x of [-1.18, 1.18]) {
    const arm = box(0.26, 0.5, 0.92, COL.couchDark, { roughness: 0.95 });
    arm.position.set(x, 0.45, 0);
    couch.add(arm);
  }
  for (const [x, z] of [
    [-0.95, 0.38],
    [0.95, 0.38],
    [-0.95, -0.38],
    [0.95, -0.38],
  ]) {
    const leg = box(0.07, 0.16, 0.07, COL.couchLeg, { roughness: 0.5 });
    leg.position.set(x, 0.08, z);
    couch.add(leg);
  }
  couch.position.set(0, 0, 1.28);
  scene.add(couch);

  // ── desk + chair against the right wall (+X), empty desk ────────────────────
  // built facing −Z then rotated a quarter turn so its 1.7m length runs along
  // the wall; pushed back so its rear edge meets the wall (x = ROOM_HALF)
  const desk = new THREE.Group();
  const deskTop = box(2.2, 0.05, 0.72, COL.deskTop, { roughness: 0.6 });
  deskTop.position.y = 0.74;
  desk.add(deskTop);
  for (const [x, z] of [
    [-1.0, 0.28],
    [1.0, 0.28],
    [-1.0, -0.28],
    [1.0, -0.28],
  ]) {
    const leg = box(0.06, 0.72, 0.06, COL.deskLeg, { roughness: 0.4, metalness: 0.3 });
    leg.position.set(x, 0.36, z);
    desk.add(leg);
  }
  desk.rotation.y = Math.PI / 2; // length now runs along the wall (Z)
  desk.position.set(ROOM_HALF - 0.45, 0, 0.24); // rear edge (0.72 deep) ≈ at the wall face
  scene.add(desk);

  // chair on the room side of the desk, facing it (+X toward the wall), tucked in
  // with a clear gap so it doesn't clip the desk
  const chair = makeChair();
  chair.position.set(2.0, 0, 0.0); // a little to the left along the desk, clear of it
  chair.rotation.y = Math.PI / 2;
  scene.add(chair);

  // a small potted plant on the LEFT end of the desktop
  const deskPlant = makePlant('bushy', 0.45, COL.potStone);
  deskPlant.position.set(2.75, 0.765, -0.4);
  deskPlant.rotation.y = 0.8;
  scene.add(deskPlant);

  // a chess set on the RIGHT end of the desktop — modelled now, made playable
  // later (makeChessSet builds a queryable board + pieces, no game logic yet).
  // Rotated so the white side (local −Z) faces −X, toward the centre of the room.
  const chessSet = makeChessSet();
  chessSet.position.set(2.75, 0.765, 0.8); // centred on the desk depth
  chessSet.rotation.y = Math.PI / 2;
  scene.add(chessSet);

  // a book and a few pens in the middle of the desk so it isn't bare
  const book = makeBook(0x6b3b4a);
  book.position.set(2.82, 0.765, 0.18);
  book.rotation.y = 0.22;
  scene.add(book);
  [0x2f6fb0, 0xcf4b3a, 0xf2c23e].forEach((col, i) => {
    const pen = cylinder(0.006, 0.006, 0.15, col, { segments: 8 });
    pen.rotation.z = Math.PI / 2; // lie flat
    pen.rotation.y = 0.35 + i * 0.16; // fan them out
    pen.position.set(2.64, 0.771, 0.32 + i * 0.024);
    scene.add(pen);
  });

  // ── plants: mostly bulky leafy ones (the favourite), scattered around, with a
  // single tall snake-plant for variety. [plant, x, z, rotationY] ───────────────
  const plants: Array<[ReturnType<typeof makePlant>, number, number, number]> = [
    // front-right corner cluster (orientation = looking at the TV): the big one
    // hugs the corner, the other two trail toward the window
    [makePlant('bushy', 1.8, COL.potStone), 2.6, -2.8, 1.4], // corner — big and bulky
    [makePlant('bushy', 1.15, COL.potTerra), 2.08, -2.76, 0.6],
    [makePlant('bushy', 0.95, COL.potDark), 2.8, -2.16, 2.2],
    // back-left corner — a single big plant in the corner
    [makePlant('bushy', 1.8, COL.potTerra), -2.64, 2.56, 0.2],
    // back-right corner + desk gap
    [makePlant('bushy', 1.1, COL.potDark), 2.64, 2.56, 1.7],
    [makePlant('bushy', 0.95, COL.potTerra), 2.72, 1.6, 1.3],
  ];
  for (const [plant, x, z, rotationY] of plants) {
    plant.position.set(x, 0, z);
    plant.rotation.y = rotationY;
    scene.add(plant);
  }

  // ── painter's easel + decoration, in the corner to the left of the TV ───────
  const easel = makeEasel();
  easel.position.set(-2.52, 0, -2.36);
  easel.rotation.y = 0.6; // angled out of the corner to face the room
  scene.add(easel);

  // a stool beside it holding a paint palette
  const stool = new THREE.Group();
  const stoolSeat = box(0.34, 0.05, 0.34, 0x7a5230, { roughness: 0.7 });
  stoolSeat.position.y = 0.5;
  stool.add(stoolSeat);
  for (const [sx, sz] of [
    [-0.12, -0.12],
    [0.12, -0.12],
    [-0.12, 0.12],
    [0.12, 0.12],
  ]) {
    const leg = box(0.035, 0.5, 0.035, 0x5b3f28, { roughness: 0.7 });
    leg.position.set(sx, 0.25, sz);
    stool.add(leg);
  }
  // off to the right of the easel, not directly in front of the canvas
  const stoolX = -1.68;
  const stoolZ = -2.28;
  stool.position.set(stoolX, 0, stoolZ);
  scene.add(stool);

  const palette = cylinder(0.16, 0.16, 0.012, 0x8a6a45, { roughness: 0.7, segments: 22 });
  palette.scale.z = 0.7;
  palette.position.set(stoolX, 0.53, stoolZ);
  palette.rotation.y = 0.5;
  scene.add(palette);
  [0xd13b3b, 0x2f6fb0, 0xf2c23e, 0xffffff, 0x3a8f4a].forEach((col, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2;
    const dab = sphere(0.02, col, { roughness: 0.5 });
    dab.scale.y = 0.4;
    dab.position.set(stoolX + Math.cos(angle) * 0.09, 0.54, stoolZ + Math.sin(angle) * 0.06);
    scene.add(dab);
  });

  // a couple of paint cans on the floor by the easel
  [0xcf4b3a, 0x3a6fa0].forEach((col, i) => {
    const can = cylinder(0.07, 0.07, 0.16, 0xbdbdb5, {
      roughness: 0.4,
      metalness: 0.5,
      segments: 16,
    });
    can.position.set(-2.72 + i * 0.22, 0.08, -2.68);
    scene.add(can);
    const paint = cylinder(0.066, 0.066, 0.02, col, { segments: 16 });
    paint.position.set(-2.72 + i * 0.22, 0.17, -2.68);
    scene.add(paint);
  });

  // (No outside ground/landscape — the room floats in the open sky, with just
  // the golden-hour skybox visible through the windows.)

  // ── lighting ────────────────────────────────────────────────────────────────
  addSky(scene); // golden-hour sun (directional, casts shadows) + sky + clouds
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x6b5a44, 0.75));
  // soft cool fill from the opposite side so shadows aren't pure black
  const fill = new THREE.DirectionalLight(0xbcd2ff, 0.35);
  fill.position.set(7, 5, -5);
  scene.add(fill);

  // ── the CRT television ──────────────────────────────────────────────────────
  // tvGroup is the click target. tvBody is the cabinet box behind the DOM bezel,
  // scaled/positioned at runtime by Scene.tsx. The rear shell makes it read as a
  // real CRT tube from the sides/back (the DOM is the front, against the wall).
  const tvGroup = new THREE.Group();

  // low modern media console (mid-century legs)
  const console = box(1.7, 0.34, 0.46, COL.console, { roughness: 0.55 });
  console.position.set(0, 0.34, TV_FRONT_Z - 0.18);
  tvGroup.add(console);
  for (const [x, z] of [
    [-0.75, TV_FRONT_Z - 0.02],
    [0.75, TV_FRONT_Z - 0.02],
    [-0.75, TV_FRONT_Z - 0.34],
    [0.75, TV_FRONT_Z - 0.34],
  ]) {
    const leg = cylinder(0.025, 0.02, 0.18, COL.consoleLeg, {
      roughness: 0.4,
      metalness: 0.4,
      segments: 10,
    });
    leg.position.set(x, 0.09, z);
    leg.rotation.x = 0.12;
    tvGroup.add(leg);
  }

  // cabinet box behind the DOM bezel — runtime-scaled/positioned by Scene.tsx
  const tvBody = box(1, 1, 1, COL.crtCabinet, { roughness: 0.7 });
  tvBody.position.set(0, 1, TV_FRONT_Z - 0.09); // placeholder until synced
  tvBody.scale.set(1.05, 0.86, 0.16);
  tvGroup.add(tvBody);

  // rear tube shell: a tapered frustum from cabinet-sized down to a small neck,
  // running back toward the wall. 4-sided cylinder, faces axis-aligned (θ=π/4),
  // axis turned to lie along Z with the big end toward the room.
  const shellMaterial = new THREE.MeshStandardMaterial({ color: COL.crtShell, roughness: 0.65 });
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.6, 0.44, 4, 1, false, Math.PI / 4),
    shellMaterial,
  );
  shell.rotation.x = -Math.PI / 2; // axis Y → −Z; big (bottom) end faces the room
  shell.scale.set(1.12, 1, 0.86); // local x → world width, local z → world height
  // y matches the runtime cabinet centre (≈1.0m); front opening (~0.95×0.73) is
  // kept smaller than the cabinet box so it tucks in behind the DOM bezel.
  // z tracks the TV front so the tube still runs back toward the wall.
  shell.position.set(0, 1.0, TV_FRONT_Z - 0.37);
  shell.castShadow = true;
  tvGroup.add(shell);

  scene.add(tvGroup);
  return { tvGroup, tvBody };
}
