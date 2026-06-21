/**
 * Assembles the 3D home-office room from the per-domain builders in this folder.
 * Everything outside relies only on the returned handles ({ tvGroup, tvBody })
 * and the exported constants (re-exported below) — a future single-GLTF room
 * just needs to keep that contract.
 *
 * The room (6.4×6.4m, walls at ±3.2, ceiling 3.2m): a low media console on the
 * TV wall (−Z) with the CRT on it, a plain sofa facing it, a desk + chair along
 * the right wall (+X), a painter's corner left of the TV, plants scattered
 * around, and big floor-to-ceiling windows on the left (−X) and back (+Z) walls
 * looking onto a golden-hour sky.
 */
import * as THREE from 'three';
import { addShell } from './shell';
import { addSeating } from './seating';
import { addWorkstation } from './workstation';
import { addPlants } from './plants';
import { addArtCorner } from './artCorner';
import { addEnvironment } from './environment';
import { addTv } from './tv';

export {
  BOUNDS,
  EYE_HEIGHT,
  STANDING_SPOT,
  WORLD_PER_PX,
  TV_FRONT_Z,
  STAND_TOP_Y,
  CLOSEUP_FOV,
  WALKING_FOV,
} from './constants';

export function buildRoom(scene: THREE.Scene): { tvGroup: THREE.Group; tvBody: THREE.Mesh } {
  addShell(scene);
  addSeating(scene);
  addWorkstation(scene);
  addPlants(scene);
  addArtCorner(scene);
  addEnvironment(scene);
  return addTv(scene);
}
