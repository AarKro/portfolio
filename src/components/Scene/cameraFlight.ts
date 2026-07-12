import * as THREE from 'three';
import { easeInOut } from '../../utils/easing';

interface Flight {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromQuat: THREE.Quaternion;
  toQuat: THREE.Quaternion;
  fromFov: number;
  toFov: number;
  elapsed: number;
  duration: number;
  onDone: () => void;
}

export interface FlightController {
  /** A flight is in progress. */
  readonly active: boolean;
  start(
    toPos: THREE.Vector3,
    toQuat: THREE.Quaternion,
    toFov: number,
    duration: number,
    onDone: () => void,
  ): void;
  /** Advance the flight; returns true while flying (a frame needs drawing). */
  update(delta: number): boolean;
}

/** Eased camera flights: position, orientation and FOV lerped over a duration. */
export function createFlightController(camera: THREE.PerspectiveCamera): FlightController {
  let flight: Flight | null = null;

  return {
    get active() {
      return flight !== null;
    },

    start(toPos, toQuat, toFov, duration, onDone) {
      flight = {
        fromPos: camera.position.clone(),
        toPos: toPos.clone(),
        fromQuat: camera.quaternion.clone(),
        toQuat: toQuat.clone(),
        fromFov: camera.fov,
        toFov,
        elapsed: 0,
        duration,
        onDone,
      };
    },

    update(delta) {
      if (!flight) return false;
      flight.elapsed += delta;
      const t = THREE.MathUtils.clamp(flight.elapsed / flight.duration, 0, 1);
      const eased = easeInOut(t);
      camera.position.lerpVectors(flight.fromPos, flight.toPos, eased);
      camera.quaternion.slerpQuaternions(flight.fromQuat, flight.toQuat, eased);
      camera.fov = THREE.MathUtils.lerp(flight.fromFov, flight.toFov, eased);
      camera.updateProjectionMatrix();
      if (t >= 1) {
        const { onDone } = flight;
        flight = null;
        onDone();
      }
      return true;
    },
  };
}
