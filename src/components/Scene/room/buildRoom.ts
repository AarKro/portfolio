/**
 * Assembles the 3D room from the per-domain builders in this folder. Outside
 * code relies only on the returned handles ({ tvGroup, tvBody }) and the
 * re-exported constants — a future single-GLTF room must keep that contract.
 */
import * as THREE from 'three';
import { addShell } from './models/shell';
import { addSeating } from './models/seating';
import { addWorkstation } from './models/workstation';
import { addPlants } from './models/plants';
import { addArtCorner } from './models/artCorner';
import { addEnvironment } from './models/environment';
import { addTv } from './models/tv';
import { addPaper } from './models/paper';

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
  addPaper(scene);
  return addTv(scene);
}
