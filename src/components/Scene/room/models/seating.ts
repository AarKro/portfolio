/** The seating area: the rug and the couch (the spot you "got up" from). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { COL } from '../palette';
import couchUrl from '../../../../assets/models/couch.glb?url';

/** Target real-world width of the couch model (m). */
const COUCH_WIDTH = 2.2;
/** Couch placement on the floor. Facing the TV, −X is "left"; nudged left of
 *  centre from the old spot (x was 0). */
const COUCH_POS = new THREE.Vector3(-1.5, 0, 1.25);
/** Base yaw so the couch faces the TV (−Z) — flip by Math.PI if it loads
 *  backwards — then turned 40° clockwise (seen from above = negative yaw). */
const COUCH_FACING = Math.PI;
const COUCH_YAW = COUCH_FACING - THREE.MathUtils.degToRad(40);

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

  // couch — a CC-BY low-poly model (see couch.glb), loaded async. It pops in
  // once loaded; the room is only seen after the power-off flight, which
  // re-renders every frame, so it's there by the time you walk in.
  loadCouch(scene).catch((error) => console.error('couch failed to load', error));
}

/** Load the couch glb, recentre it (base on the floor, centred in X/Z), scale it
 *  to COUCH_WIDTH, and set it down facing the TV. */
async function loadCouch(scene: THREE.Scene): Promise<void> {
  const gltf = await new GLTFLoader().loadAsync(couchUrl);
  const model = gltf.scene;
  // strip the gltf's baked texture for a flat tone that matches the room
  const fabric = new THREE.MeshStandardMaterial({ color: COL.couch, roughness: 0.92 });
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      const previous = object.material;
      object.material = fabric;
      (Array.isArray(previous) ? previous : [previous]).forEach((material) => {
        (material as THREE.MeshStandardMaterial).map?.dispose();
        material.dispose();
      });
    }
  });

  model.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(model);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  // base to y=0, centred in X/Z (the group is then scaled/placed as a whole)
  model.position.set(-center.x, -bbox.min.y, -center.z);

  const couch = new THREE.Group();
  couch.add(model);
  couch.scale.setScalar(COUCH_WIDTH / size.x);
  couch.position.copy(COUCH_POS);
  couch.rotation.y = COUCH_YAW;
  scene.add(couch);
}
