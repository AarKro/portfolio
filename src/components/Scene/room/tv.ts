/**
 * The CRT television on its media console against the −Z wall.
 *
 * The TV has no front face here — its screen/controls/cabinet front IS the real
 * DOM website, projected onto `tvBody` by Scene.tsx via CSS3DRenderer. This
 * builds the wooden cabinet box (sized/positioned at runtime from the measured
 * DOM) plus the rear tube shell so the set reads as a real CRT from the
 * sides/back. `tvGroup` is the click target.
 */
import * as THREE from 'three';
import { box, cylinder } from './primitives';
import { COL } from './palette';
import { TV_FRONT_Z } from './constants';

export function addTv(scene: THREE.Scene): { tvGroup: THREE.Group; tvBody: THREE.Mesh } {
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
