/**
 * Builds the 3D living room out of PLACEHOLDER primitives (boxes, planes,
 * cylinders). The plan is to replace this procedural geometry with an
 * imported GLTF model later — keep that swap in mind:
 *
 * Everything outside this file only relies on the returned handles
 * ({ tvGroup, screenMesh }) and the exported position constants. A future
 * GLTF version just needs to load the model, find/attach the TV group and
 * a screen mesh for the static texture, and return the same shape.
 */
import * as THREE from 'three';

/** Walkable area (room is 8x8m, walls at ±4) */
export const BOUNDS = { minX: -3.4, maxX: 3.4, minZ: -2.2, maxZ: 3.4 };
export const EYE_HEIGHT = 1.6;

/** Where the camera ends up after "getting off the couch" */
export const STANDING_SPOT = new THREE.Vector3(0, EYE_HEIGHT, 1.7);
/** Center of the 3D TV's glass, world space (the screen-glow light sits here) */
export const TV_SCREEN_CENTER = new THREE.Vector3(0, 1.13, -3.349);
/**
 * Zoom transition endpoints: the camera starts/ends here, looking at
 * TV_FRAME_TARGET, framing the 3D cabinet at the same apparent size as the
 * 2D TV — that's what makes the crossfade read as one continuous zoom.
 * Derived from the cabinet (1.1 × 0.92, front at z=-3.35, center y=1.04)
 * filling ~78% of a 55° vertical FOV. Recompute if the TV is resized.
 */
export const TV_FRAME_TARGET = new THREE.Vector3(0, 1.04, -3.35);
export const CLOSEUP_POSITION = new THREE.Vector3(0, 1.04, -2.22);
/** FOV used at the closeup endpoints (walking FOV is wider) */
export const CLOSEUP_FOV = 55;
export const WALKING_FOV = 70;

const WOOD_DARK = 0x3a2515;
const WOOD_MID = 0x5b3a22;
const PANEL_CREAM = 0xd9c9a8;

function box(
  w: number,
  h: number,
  d: number,
  color: number,
  opts: { roughness?: number } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.85 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Mirrors the 2D TVSet's design so the zoom transition reads as the same
 * object: 4:3 screen in the upper cabinet, cream control strip below it
 * (badge · green channel display · buttons · knobs), two feet, rabbit ears.
 */
function buildTV(noiseTexture: THREE.Texture): { tvGroup: THREE.Group; screenMesh: THREE.Mesh } {
  const tvGroup = new THREE.Group();

  const stand = box(1.5, 0.5, 0.7, WOOD_DARK);
  stand.position.y = 0.25;
  tvGroup.add(stand);

  // two feet, like the 2D set (stand top is at y=0.5)
  for (const x of [-0.38, 0.38]) {
    const foot = box(0.12, 0.08, 0.42, WOOD_DARK);
    foot.position.set(x, 0.54, 0);
    tvGroup.add(foot);
  }

  // cabinet: 1.1 × 0.92 — same width:height feel as the 2D cabinet
  const cabinet = box(1.1, 0.92, 0.5, WOOD_MID);
  cabinet.position.y = 1.04;
  tvGroup.add(cabinet);

  // the glass: 4:3 like the 2D tube, upper part of the cabinet
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.615),
    new THREE.MeshBasicMaterial({ map: noiseTexture, color: 0xa8b2a8 }),
  );
  screenMesh.position.set(0, 1.13, 0.251);
  tvGroup.add(screenMesh);

  // cream control strip below the screen, like the 2D panel
  const panel = box(0.95, 0.14, 0.02, PANEL_CREAM);
  panel.position.set(0, 0.69, 0.252);
  tvGroup.add(panel);

  // panel details, left to right: dark badge, green channel display, knobs
  const badge = box(0.12, 0.05, 0.012, 0x4a3b28);
  badge.position.set(-0.36, 0.69, 0.263);
  tvGroup.add(badge);

  const display = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.06, 0.012),
    new THREE.MeshStandardMaterial({
      color: 0x0c120c,
      emissive: 0x4dff88,
      emissiveIntensity: 0.7,
    }),
  );
  display.position.set(-0.12, 0.69, 0.263);
  tvGroup.add(display);

  for (const x of [0.04, 0.14]) {
    const button = box(0.07, 0.045, 0.014, 0xf6ecd6);
    button.position.set(x, 0.69, 0.263);
    tvGroup.add(button);
  }

  for (const x of [0.29, 0.39]) {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.035, 16),
      new THREE.MeshStandardMaterial({ color: 0x2e2e2a, roughness: 0.4, metalness: 0.5 }),
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.set(x, 0.69, 0.262);
    tvGroup.add(knob);
  }

  // rabbit ears (cabinet top is at y=1.5)
  const antennaBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x2e2e2a, roughness: 0.5 }),
  );
  antennaBase.position.set(0, 1.5, 0);
  tvGroup.add(antennaBase);
  for (const tilt of [-0.5, 0.42]) {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.3, metalness: 0.8 }),
    );
    rod.position.y = 0.28;
    const pivot = new THREE.Group();
    pivot.position.set(0, 1.5, 0);
    pivot.rotation.z = tilt;
    pivot.add(rod);
    tvGroup.add(pivot);
  }

  tvGroup.position.set(0, 0, -3.6);
  return { tvGroup, screenMesh };
}

export function buildRoom(
  scene: THREE.Scene,
  noiseTexture: THREE.Texture,
): { tvGroup: THREE.Group; screenMesh: THREE.Mesh } {
  // floor / ceiling / walls
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: 0x54381f, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 1 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.2;
  scene.add(ceiling);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3b2b1d, roughness: 0.95 });
  const wallGeometry = new THREE.PlaneGeometry(8, 3.2);
  const walls: Array<[THREE.Vector3, number]> = [
    [new THREE.Vector3(0, 1.6, -4), 0],
    [new THREE.Vector3(0, 1.6, 4), Math.PI],
    [new THREE.Vector3(-4, 1.6, 0), Math.PI / 2],
    [new THREE.Vector3(4, 1.6, 0), -Math.PI / 2],
  ];
  for (const [position, rotationY] of walls) {
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.copy(position);
    wall.rotation.y = rotationY;
    wall.receiveShadow = true;
    scene.add(wall);
  }

  // rug between couch and TV
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(1.8, 40),
    new THREE.MeshStandardMaterial({ color: 0x6e3526, roughness: 1 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.scale.x = 1.3;
  rug.position.set(0, 0.01, 0.6);
  rug.receiveShadow = true;
  scene.add(rug);

  // couch (the spot you "got up" from)
  const couch = new THREE.Group();
  const seat = box(2.1, 0.4, 0.9, 0x7a4434, { roughness: 0.95 });
  seat.position.y = 0.35;
  couch.add(seat);
  const back = box(2.1, 0.7, 0.25, 0x7a4434, { roughness: 0.95 });
  back.position.set(0, 0.75, 0.33);
  couch.add(back);
  for (const x of [-1.19, 1.19]) {
    const arm = box(0.28, 0.62, 0.9, 0x6b3a2c, { roughness: 0.95 });
    arm.position.set(x, 0.46, 0);
    couch.add(arm);
  }
  couch.position.set(0, 0, 2.7);
  scene.add(couch);

  // floor lamp in the corner by the TV
  const lamp = new THREE.Group();
  const lampBase = box(0.36, 0.05, 0.36, 0x2e2e2a);
  lampBase.position.y = 0.025;
  lamp.add(lampBase);
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.45, 10),
    new THREE.MeshStandardMaterial({ color: 0x2e2e2a, roughness: 0.4, metalness: 0.6 }),
  );
  pole.position.y = 0.75;
  lamp.add(pole);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.32, 0.42, 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xe8cfa0,
      roughness: 0.9,
      emissive: 0xffb070,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide,
    }),
  );
  shade.position.y = 1.55;
  lamp.add(shade);
  lamp.position.set(2.9, 0, -2.9);
  scene.add(lamp);

  // lighting: warm lamp glow + faint green spill from the TV static
  const lampLight = new THREE.PointLight(0xffb070, 28, 0, 2);
  lampLight.position.set(2.9, 1.45, -2.9);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  scene.add(lampLight);

  const screenGlow = new THREE.PointLight(0x66ff99, 2, 5, 2);
  screenGlow.position.set(TV_SCREEN_CENTER.x, TV_SCREEN_CENTER.y, TV_SCREEN_CENTER.z + 0.4);
  scene.add(screenGlow);

  scene.add(new THREE.HemisphereLight(0x8a7560, 0x1c130c, 0.5));

  const { tvGroup, screenMesh } = buildTV(noiseTexture);
  scene.add(tvGroup);

  return { tvGroup, screenMesh };
}
