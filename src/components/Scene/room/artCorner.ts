/**
 * The painter's corner to the left of the TV: a tripod easel with a big canvas,
 * a stool holding a paint palette, and a couple of paint cans on the floor.
 * The canvas front face is a separate mesh named 'canvasSurface' (in a group
 * named 'canvas') so a paintable texture can be wired onto it later.
 */
import * as THREE from 'three';
import { box, cylinder, sphere } from './primitives';

// tripod easel holding a big canvas, built at origin facing +Z
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

export function addArtCorner(scene: THREE.Scene): void {
  const easel = makeEasel();
  easel.position.set(-2.52, 0, -2.36);
  easel.rotation.y = 0.6; // angled out of the corner to face the room
  scene.add(easel);

  // a stool beside it holding a paint palette (off to the right of the easel,
  // not directly in front of the canvas)
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
}
