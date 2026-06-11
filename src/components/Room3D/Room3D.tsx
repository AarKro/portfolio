import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { fillNoise } from '../../utils/noise';
import {
  BOUNDS,
  CLOSEUP_FOV,
  CLOSEUP_POSITION,
  EYE_HEIGHT,
  STANDING_SPOT,
  TV_FRAME_TARGET,
  WALKING_FOV,
  buildRoom,
} from './buildRoom';
import './Room3D.scss';

/** Camera pull-back when leaving the 2D portfolio (seconds) */
const ENTER_DURATION = 1.9;
/**
 * The camera holds the 2D-matching framing this long before pulling back,
 * so the DOM→canvas crossfade happens between two identical-looking TVs.
 * Keep slightly above the `tv-depart` fade duration in App.scss.
 */
const ENTER_HOLD = 0.55;
/** Camera fly-in when clicking the 3D TV (seconds) */
const LEAVE_DURATION = 1.15;
const WALK_SPEED = 3;
/** Max distance (m) from which the TV can be clicked */
const TV_REACH = 4;
const NOISE_WIDTH = 128;
const NOISE_HEIGHT = 96;

export type RoomPhase = 'enter' | 'idle' | 'leave';

interface Room3DProps {
  phase: RoomPhase;
  onEnterComplete: () => void;
  onLeaveComplete: () => void;
  onTVClick: () => void;
}

interface CameraFlight {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromQuat: THREE.Quaternion;
  toQuat: THREE.Quaternion;
  fromFov: number;
  toFov: number;
  /** Negative elapsed = hold the start framing before moving */
  elapsed: number;
  duration: number;
  onDone: () => void;
}

const easeInOut = (t: number) => t * t * (3 - 2 * t);

function quaternionLookingAt(from: THREE.Vector3, target: THREE.Vector3): THREE.Quaternion {
  const matrix = new THREE.Matrix4().lookAt(from, target, new THREE.Vector3(0, 1, 0));
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

/**
 * The first-person 3D living room. Mounts mid "zoom out" (camera starts at
 * the 3D TV's glass and pulls back), then hands control to the visitor:
 * pointer-lock mouselook, WASD walking, click the TV to fly back in.
 */
export function Room3D({ phase, onEnterComplete, onLeaveComplete, onTVClick }: Room3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ startLeave: () => void } | null>(null);

  // Latest callbacks in a ref so the one-time scene setup never goes stale
  const callbacksRef = useRef({ onEnterComplete, onLeaveComplete, onTVClick });
  callbacksRef.current = { onEnterComplete, onLeaveComplete, onTVClick };

  useEffect(() => {
    const container = containerRef.current!;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0805);
    const camera = new THREE.PerspectiveCamera(
      CLOSEUP_FOV,
      container.clientWidth / container.clientHeight,
      0.05,
      50,
    );

    // animated static on the 3D TV, same noise as the 2D screen
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = NOISE_WIDTH;
    noiseCanvas.height = NOISE_HEIGHT;
    const noiseCtx = noiseCanvas.getContext('2d')!;
    const noiseImage = noiseCtx.createImageData(NOISE_WIDTH, NOISE_HEIGHT);
    const noiseTexture = new THREE.CanvasTexture(noiseCanvas);

    const { tvGroup } = buildRoom(scene, noiseTexture);

    const controls = new PointerLockControls(camera, renderer.domElement);
    const raycaster = new THREE.Raycaster();
    const screenCenter = new THREE.Vector2(0, 0);
    const keys = new Set<string>();
    let flight: CameraFlight | null = null;

    const showOverlay = (visible: boolean) =>
      overlayRef.current?.classList.toggle('room3d__overlay--hidden', !visible);
    const showCrosshair = (visible: boolean) =>
      crosshairRef.current?.classList.toggle('room3d__crosshair--visible', visible);

    // zoom out: hold the framing that matches the 2D TV while the DOM layer
    // fades, then pull back to standing (FOV widens along the way)
    camera.position.copy(CLOSEUP_POSITION);
    camera.quaternion.copy(quaternionLookingAt(CLOSEUP_POSITION, TV_FRAME_TARGET));
    flight = {
      fromPos: CLOSEUP_POSITION.clone(),
      toPos: STANDING_SPOT.clone(),
      fromQuat: camera.quaternion.clone(),
      toQuat: quaternionLookingAt(STANDING_SPOT, TV_FRAME_TARGET),
      fromFov: CLOSEUP_FOV,
      toFov: WALKING_FOV,
      elapsed: -ENTER_HOLD,
      duration: ENTER_DURATION,
      onDone: () => {
        showOverlay(true);
        callbacksRef.current.onEnterComplete();
      },
    };

    apiRef.current = {
      startLeave: () => {
        // set the flight before unlocking so the unlock handler stays quiet
        flight = {
          fromPos: camera.position.clone(),
          toPos: CLOSEUP_POSITION.clone(),
          fromQuat: camera.quaternion.clone(),
          toQuat: quaternionLookingAt(CLOSEUP_POSITION, TV_FRAME_TARGET),
          fromFov: camera.fov,
          toFov: CLOSEUP_FOV,
          elapsed: 0,
          duration: LEAVE_DURATION,
          onDone: () => callbacksRef.current.onLeaveComplete(),
        };
        controls.unlock();
        showOverlay(false);
        showCrosshair(false);
      },
    };

    const onClick = () => {
      if (flight) return;
      if (!controls.isLocked) {
        controls.lock();
        return;
      }
      raycaster.setFromCamera(screenCenter, camera);
      const hit = raycaster.intersectObject(tvGroup, true)[0];
      if (hit && hit.distance <= TV_REACH) callbacksRef.current.onTVClick();
    };
    container.addEventListener('click', onClick);

    const onLock = () => {
      showOverlay(false);
      showCrosshair(true);
    };
    const onUnlock = () => {
      showCrosshair(false);
      if (!flight) showOverlay(true); // ESC pressed, not a zoom-in
    };
    controls.addEventListener('lock', onLock);
    controls.addEventListener('unlock', onUnlock);

    const onKeyDown = (event: KeyboardEvent) => keys.add(event.code);
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frame = 0;
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (frame++ % 2 === 0) {
        fillNoise(noiseImage.data);
        noiseCtx.putImageData(noiseImage, 0, 0);
        noiseTexture.needsUpdate = true;
      }

      if (flight) {
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
      } else if (controls.isLocked) {
        const forward = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
        const sideways = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
        if (forward) controls.moveForward(forward * WALK_SPEED * delta);
        if (sideways) controls.moveRight(sideways * WALK_SPEED * delta);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, BOUNDS.minX, BOUNDS.maxX);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, BOUNDS.minZ, BOUNDS.maxZ);
        camera.position.y = EYE_HEIGHT;

        // highlight the crosshair when the TV is in reach
        raycaster.setFromCamera(screenCenter, camera);
        const hit = raycaster.intersectObject(tvGroup, true)[0];
        crosshairRef.current?.classList.toggle(
          'room3d__crosshair--target',
          !!hit && hit.distance <= TV_REACH,
        );
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('click', onClick);
      controls.removeEventListener('lock', onLock);
      controls.removeEventListener('unlock', onUnlock);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      if (controls.isLocked) controls.unlock();
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      noiseTexture.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase === 'leave') apiRef.current?.startLeave();
  }, [phase]);

  return (
    <div ref={containerRef} className="room3d">
      <div ref={crosshairRef} className="room3d__crosshair" aria-hidden="true" />
      <div ref={overlayRef} className="room3d__overlay room3d__overlay--hidden">
        <div className="room3d__overlay-panel">
          <p className="room3d__overlay-title">YOU GOT UP FROM THE COUCH</p>
          <p>CLICK to look around · WASD to walk</p>
          <p>Walk up to the TV and click it to sit back down</p>
          <p className="room3d__overlay-esc">ESC frees the mouse</p>
        </div>
      </div>
    </div>
  );
}
