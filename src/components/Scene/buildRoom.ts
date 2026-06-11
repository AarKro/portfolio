/**
 * Builds the 3D living room out of PLACEHOLDER primitives (boxes, planes,
 * cylinders). The plan is to replace this procedural geometry with an
 * imported GLTF model later — keep that swap in mind:
 *
 * Everything outside this file only relies on the returned handles and the
 * exported constants. A future GLTF version just needs to load the model
 * and return the same shape.
 *
 * Note: the TV has no front face here. Its screen/controls/cabinet front IS
 * the real DOM website, projected into the scene by Scene.tsx via
 * CSS3DRenderer. This file only provides the wooden body behind it (sized
 * at runtime from the measured DOM) and the stand it sits on.
 */
import * as THREE from 'three';

/** Walkable area (room is 8x8m, walls at ±4) */
export const BOUNDS = { minX: -3.4, maxX: 3.4, minZ: -2.2, maxZ: 3.4 };
export const EYE_HEIGHT = 1.6;

/** Where the camera ends up after "getting off the couch" */
export const STANDING_SPOT = new THREE.Vector3(0, EYE_HEIGHT, 1.7);

/** World units per CSS pixel: the 920px-wide DOM cabinet ≈ 1.1m */
export const WORLD_PER_PX = 1.1 / 920;
/** Z of the TV's front plane (the DOM face) — the wall is at -4 */
export const TV_FRONT_Z = -3.35;
/** Top of the TV stand: the DOM TV's feet rest here */
export const STAND_TOP_Y = 0.5;

/** FOV at the closeup (website) framing; widens while walking */
export const CLOSEUP_FOV = 55;
export const WALKING_FOV = 70;

const WOOD_DARK = 0x3a2515;
const WOOD_MID = 0x5b3a22;

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

export function buildRoom(scene: THREE.Scene): { tvGroup: THREE.Group; tvBody: THREE.Mesh } {
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

  const lampLight = new THREE.PointLight(0xffb070, 28, 0, 2);
  lampLight.position.set(2.9, 1.45, -2.9);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  scene.add(lampLight);

  scene.add(new THREE.HemisphereLight(0x8a7560, 0x1c130c, 0.5));

  // the TV: stand + body box. The body is a unit cube that Scene.tsx scales
  // and positions to sit exactly behind the measured DOM cabinet.
  const tvGroup = new THREE.Group();

  const stand = box(1.5, 0.5, 0.7, WOOD_DARK);
  stand.position.set(0, 0.25, TV_FRONT_Z - 0.25);
  tvGroup.add(stand);

  const tvBody = box(1, 1, 1, WOOD_MID);
  tvBody.position.set(0, 1, TV_FRONT_Z - 0.26); // placeholder until synced
  tvBody.scale.set(1.1, 0.9, 0.5);
  tvGroup.add(tvBody);

  scene.add(tvGroup);
  return { tvGroup, tvBody };
}
