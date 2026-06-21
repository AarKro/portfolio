/** The seating area: the rug and the plain sofa (the spot you "got up" from). */
import * as THREE from 'three';
import { box } from './primitives';
import { COL } from './palette';

export function addSeating(scene: THREE.Scene): void {
  // rug under the seating area
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(1.85, 48),
    new THREE.MeshStandardMaterial({ color: COL.rug, roughness: 1 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.scale.x = 1.35;
  rug.position.set(0, 0.01, 0.72);
  rug.receiveShadow = true;
  scene.add(rug);

  // sofa — plain and simple, facing the TV
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
}
