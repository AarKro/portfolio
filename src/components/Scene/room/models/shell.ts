/**
 * The room shell: floor, ceiling, the two solid walls (TV wall −Z, right wall
 * +X) and the two windowed walls (left −X, back +Z). Walls are solid slabs that
 * overlap at the corners and run past the floor/ceiling so the shell is
 * watertight (no seam light-leaks).
 *
 * All the wall slabs share one material and all the window frame bars share
 * another, so each set is baked into a single merged geometry — the whole shell
 * is just floor + ceiling + one wall mesh + one frame mesh + two glass panes.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CEILING_Y, ROOM_HALF, WALL_T } from '../constants';
import { COL } from '../palette';

const wallTop = CEILING_Y + 0.15;
const wallBottom = -0.15;
const wallHeight = wallTop - wallBottom;
const wallMidY = (wallTop + wallBottom) / 2;

// A full wall hollowed out by a centered floor-to-ceiling opening — side jambs +
// a slim header + a thin sill (all solid slabs) make the hole — then a faint
// glass pane fills it behind a minimal black frame with one transom bar. The
// slab/frame geometries are pushed into the shared `wallGeos`/`frameGeos` arrays
// (merged once by the caller); only the glass is added as its own mesh.
// `normalAxis` is the axis the wall's face points along: 'x' → wall at x=`at`
// spanning Z (a left/right wall); 'z' → wall at z=`at` spanning X (a front/back
// wall). `inward` (+1/−1) points the face toward the room interior. `u` below is
// the along-the-wall coordinate (Z for an 'x' wall, X for a 'z' wall).
function addWindowedWall(
  scene: THREE.Scene,
  glassMaterial: THREE.Material,
  wallGeos: THREE.BufferGeometry[],
  frameGeos: THREE.BufferGeometry[],
  opts: { normalAxis: 'x' | 'z'; at: number; inward: 1 | -1; halfWidth: number; sill: number; head: number },
) {
  const { normalAxis, at, inward, halfWidth, sill, head } = opts;
  const rotationY = normalAxis === 'x' ? (inward * Math.PI) / 2 : inward > 0 ? 0 : Math.PI;
  const top = CEILING_Y + 0.15; // overlap the ceiling
  const bottom = -0.15; // overlap the floor

  // a solid wall slab spanning `along` (along the wall) × `height`, centred on
  // the wall line at along-coord u / vertical mid yMid
  const slab = (along: number, height: number, u: number, yMid: number) => {
    const g =
      normalAxis === 'x'
        ? new THREE.BoxGeometry(WALL_T, height, along)
        : new THREE.BoxGeometry(along, height, WALL_T);
    if (normalAxis === 'x') g.translate(at, yMid, u);
    else g.translate(u, yMid, at);
    wallGeos.push(g);
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
    const g =
      normalAxis === 'x'
        ? new THREE.BoxGeometry(depth, lengthY, lengthU)
        : new THREE.BoxGeometry(lengthU, lengthY, depth);
    if (normalAxis === 'x') g.translate(at + frameOffset * inward, centerY, centerU);
    else g.translate(centerU, centerY, at + frameOffset * inward);
    frameGeos.push(g);
  };
  const midY = (sill + head) / 2;
  addBar(-halfWidth, midY, bar, head - sill); // left
  addBar(halfWidth, midY, bar, head - sill); // right
  addBar(0, sill, halfWidth * 2, bar); // bottom
  addBar(0, head, halfWidth * 2, bar); // top
  addBar(0, midY, halfWidth * 2, bar); // transom
}

export function addShell(scene: THREE.Scene): void {
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

  const wallGeos: THREE.BufferGeometry[] = [];
  const frameGeos: THREE.BufferGeometry[] = [];

  // solid walls: TV wall (−Z) and right wall (+X), centred on the wall line and
  // run past the corners so adjacent walls interlock with no gap.
  const solidWall = (w: number, d: number, x: number, z: number) => {
    const g = new THREE.BoxGeometry(w, wallHeight, d);
    g.translate(x, wallMidY, z);
    wallGeos.push(g);
  };
  const wallSpan = ROOM_HALF * 2 + 0.3;
  solidWall(wallSpan, WALL_T, 0, -ROOM_HALF); // TV wall
  solidWall(WALL_T, wallSpan, ROOM_HALF, 0); // right wall

  // big modern floor-to-ceiling windows (opening scales with the room)
  addWindowedWall(scene, glassMaterial, wallGeos, frameGeos, {
    normalAxis: 'x',
    at: -ROOM_HALF, // left wall, faces +X into the room
    inward: 1,
    halfWidth: 1.6,
    sill: 0.12,
    head: 3.0,
  }); // left window
  addWindowedWall(scene, glassMaterial, wallGeos, frameGeos, {
    normalAxis: 'z',
    at: ROOM_HALF, // back wall, faces −Z into the room
    inward: -1,
    halfWidth: 1.6,
    sill: 0.12,
    head: 3.0,
  }); // back window (behind the desk)

  // bake the slabs into one wall mesh and the bars into one frame mesh
  const walls = new THREE.Mesh(mergeGeometries(wallGeos), wallMaterial);
  walls.castShadow = true;
  walls.receiveShadow = true;
  scene.add(walls);
  wallGeos.forEach((g) => g.dispose());

  const frames = new THREE.Mesh(mergeGeometries(frameGeos), frameMaterial);
  frames.castShadow = true;
  scene.add(frames);
  frameGeos.forEach((g) => g.dispose());
}
