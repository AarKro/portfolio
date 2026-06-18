import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import {
  BOUNDS,
  CLOSEUP_FOV,
  EYE_HEIGHT,
  STANDING_SPOT,
  STAND_TOP_Y,
  TV_FRONT_Z,
  WALKING_FOV,
  WORLD_PER_PX,
  buildRoom,
} from './buildRoom';
import './Scene.scss';

/** Camera pull-back after powering off (seconds) */
const ENTER_DURATION = 1.9;
/** Camera fly-in after clicking the TV in the room (seconds) */
const LEAVE_DURATION = 1.15;
const WALK_SPEED = 3;
/** Max distance (m) from which the TV can be clicked */
const TV_REACH = 4;
/** Fraction of the viewport the DOM TV fills at the closeup framing */
const FIT_HEIGHT = 0.82;
const FIT_WIDTH = 0.9;

export type ViewMode = 'tv' | 'to-room' | 'room' | 'to-tv';

interface SceneProps {
  mode: ViewMode;
  /** Pull-back flight finished: visitor is standing in the room */
  onArrivedInRoom: () => void;
  /** Fly-in flight finished: visitor is back at the website framing */
  onArrivedAtTV: () => void;
  /** Visitor clicked the TV while walking around */
  onTVClicked: () => void;
  /** The DOM TV (TVSet) — projected onto the 3D TV body via CSS3D */
  children: ReactNode;
}

interface CameraFlight {
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

const easeInOut = (t: number) => t * t * (3 - 2 * t);

function quaternionLookingAt(from: THREE.Vector3, target: THREE.Vector3): THREE.Quaternion {
  const matrix = new THREE.Matrix4().lookAt(from, target, new THREE.Vector3(0, 1, 0));
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

/**
 * The one and only view: a three.js room containing the TV, whose front face
 * is the real DOM website (CSS3DRenderer keeps it locked onto the WebGL TV
 * body). "Website mode" is nothing more than the camera parked right in
 * front of the TV — so the power-off pull-back is inherently seamless.
 */
export function Scene({ mode, onArrivedInRoom, onArrivedAtTV, onTVClicked, children }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ flyToRoom: () => void; flyToTV: () => void } | null>(null);

  // the DOM TV lives in this detached div; CSS3DRenderer adopts it
  const [tvHost] = useState(() => {
    const host = document.createElement('div');
    host.className = 'scene__tv-host';
    return host;
  });

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const callbacksRef = useRef({ onArrivedInRoom, onArrivedAtTV, onTVClicked });
  callbacksRef.current = { onArrivedInRoom, onArrivedAtTV, onTVClicked };

  useEffect(() => {
    const container = containerRef.current!;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.classList.add('scene__canvas');
    container.appendChild(renderer.domElement);

    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(container.clientWidth, container.clientHeight);
    cssRenderer.domElement.classList.add('scene__css3d');
    container.appendChild(cssRenderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0805);
    const cssScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CLOSEUP_FOV,
      container.clientWidth / container.clientHeight,
      0.05,
      50,
    );

    const { tvGroup, tvBody } = buildRoom(scene);

    const tvObject = new CSS3DObject(tvHost);
    tvObject.scale.setScalar(WORLD_PER_PX);
    cssScene.add(tvObject);

    // Render-on-demand: the loop only draws when the camera/objects/sizes
    // change. A parked TV (every tablet, and an idle desktop) then costs ~0
    // GPU per frame. The DOM TV's own motion — video, static, OSD, teletext
    // slide, phosphor flicker — lives in the browser-composited CSS3D layer
    // and keeps animating without us re-rendering three.
    let needsRender = true;

    // Measures the DOM TV and aligns the 3D world to it: the CSS3D object,
    // the wooden body behind the cabinet, and the closeup camera framing.
    // Runs on mount, on resize, and whenever fonts/content shift the layout.
    const closeupPosition = new THREE.Vector3();
    const closeupTarget = new THREE.Vector3();
    const syncWorldToDOM = () => {
      const tvElement = tvHost.querySelector<HTMLElement>('.tv');
      const cabinet = tvHost.querySelector<HTMLElement>('.tv__cabinet');
      if (!tvElement || !cabinet) return;

      const tvHeight = tvElement.offsetHeight * WORLD_PER_PX;
      // feet rest on the stand; CSS3D centers the element on its position
      tvObject.position.set(0, STAND_TOP_Y + tvHeight / 2, TV_FRONT_Z);

      const tvTop = STAND_TOP_Y + tvHeight;
      const cabinetWidth = cabinet.offsetWidth * WORLD_PER_PX;
      const cabinetHeight = cabinet.offsetHeight * WORLD_PER_PX;
      const cabinetCenterY = tvTop - (cabinet.offsetTop + cabinet.offsetHeight / 2) * WORLD_PER_PX;
      // inset the box so its sharp corners stay hidden behind the DOM
      // cabinet's 22px rounded corners (need ≥ r·(1−1/√2) ≈ 7px)
      const cornerInset = 10 * WORLD_PER_PX;
      tvBody.scale.set(cabinetWidth - 2 * cornerInset, cabinetHeight - 2 * cornerInset, 0.5);
      tvBody.position.set(0, cabinetCenterY, TV_FRONT_Z - 0.251);

      // closeup framing: cabinet fills FIT_HEIGHT/FIT_WIDTH of the viewport
      const halfFovTan = Math.tan(THREE.MathUtils.degToRad(CLOSEUP_FOV / 2));
      const distanceForHeight = cabinetHeight / 2 / (FIT_HEIGHT * halfFovTan);
      const distanceForWidth = cabinetWidth / 2 / (FIT_WIDTH * halfFovTan * camera.aspect);
      const distance = Math.max(distanceForHeight, distanceForWidth);
      closeupTarget.set(0, cabinetCenterY, TV_FRONT_Z);
      closeupPosition.set(0, cabinetCenterY, TV_FRONT_Z + distance);

      // keep the website framing locked while parked in front of the TV
      if (modeRef.current === 'tv' && !flight) {
        camera.position.copy(closeupPosition);
        camera.quaternion.copy(quaternionLookingAt(closeupPosition, closeupTarget));
        camera.fov = CLOSEUP_FOV;
        camera.updateProjectionMatrix();
      }
      needsRender = true; // the world moved — draw at least one frame
    };

    const controls = new PointerLockControls(camera, renderer.domElement);
    const raycaster = new THREE.Raycaster();
    const screenCenter = new THREE.Vector2(0, 0);
    const keys = new Set<string>();
    let flight: CameraFlight | null = null;

    const showCrosshair = (visible: boolean) =>
      crosshairRef.current?.classList.toggle('scene__crosshair--visible', visible);

    const startFlight = (
      toPos: THREE.Vector3,
      toQuat: THREE.Quaternion,
      toFov: number,
      duration: number,
      onDone: () => void,
    ) => {
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
    };

    apiRef.current = {
      flyToRoom: () => {
        startFlight(
          STANDING_SPOT,
          quaternionLookingAt(STANDING_SPOT, closeupTarget),
          WALKING_FOV,
          ENTER_DURATION,
          () => {
            showCrosshair(controls.isLocked);
            callbacksRef.current.onArrivedInRoom();
          },
        );
        // grab the pointer right away (the PWR click's user activation is
        // still fresh) so mouselook is live the moment the flight lands
        controls.lock();
      },
      flyToTV: () => {
        // set the flight before unlocking so the unlock handler stays quiet
        startFlight(
          closeupPosition,
          quaternionLookingAt(closeupPosition, closeupTarget),
          CLOSEUP_FOV,
          LEAVE_DURATION,
          () => callbacksRef.current.onArrivedAtTV(),
        );
        controls.unlock();
        showCrosshair(false);
      },
    };

    const onClick = () => {
      if (flight || modeRef.current !== 'room') return;
      if (!controls.isLocked) {
        controls.lock();
        return;
      }
      raycaster.setFromCamera(screenCenter, camera);
      const hit = raycaster.intersectObject(tvGroup, true)[0];
      if (hit && hit.distance <= TV_REACH) callbacksRef.current.onTVClicked();
    };
    container.addEventListener('click', onClick);

    const onLock = () => {
      // during the to-room flight the crosshair waits for arrival
      showCrosshair(modeRef.current === 'room');
    };
    const onUnlock = () => {
      // ESC frees the mouse; clicking the scene re-locks (see onClick)
      showCrosshair(false);
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
      cssRenderer.setSize(container.clientWidth, container.clientHeight);
      syncWorldToDOM();
    };
    window.addEventListener('resize', onResize);

    // first CSS3D render attaches tvHost to the document, then measuring works
    cssRenderer.render(cssScene, camera);
    syncWorldToDOM();
    camera.position.copy(closeupPosition);
    camera.quaternion.copy(quaternionLookingAt(closeupPosition, closeupTarget));

    // re-sync when webfonts/content change the DOM TV's size
    const resizeObserver = new ResizeObserver(() => syncWorldToDOM());
    const tvElement = tvHost.querySelector('.tv');
    if (tvElement) resizeObserver.observe(tvElement);

    const clock = new THREE.Clock();
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (flight) {
        // a flight moves the camera every frame
        needsRender = true;
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
        // walking: the camera can move every frame
        needsRender = true;
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
          'scene__crosshair--target',
          !!hit && hit.distance <= TV_REACH,
        );
      }

      if (needsRender) {
        renderer.render(scene, camera);
        cssRenderer.render(cssScene, camera);
        needsRender = false;
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
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
      renderer.dispose();
      container.removeChild(renderer.domElement);
      container.removeChild(cssRenderer.domElement);
      apiRef.current = null;
    };
    // Deliberately mount-once: the scene is built imperatively and never
    // rebuilt — live props are read through modeRef/callbacksRef instead.
  }, []);

  // mode transitions trigger camera flights; the DOM TV is only clickable
  // while the camera is parked in front of it
  useEffect(() => {
    if (mode === 'to-room') apiRef.current?.flyToRoom();
    if (mode === 'to-tv') apiRef.current?.flyToTV();
    tvHost.style.pointerEvents = mode === 'tv' ? 'auto' : 'none';
  }, [mode, tvHost]);

  return (
    <>
      <div ref={containerRef} className={`scene ${mode === 'room' ? 'scene--walking' : ''}`}>
        <div ref={crosshairRef} className="scene__crosshair" aria-hidden="true" />

        {/* ambient control hints, mirroring hand positions: keys left, mouse right */}
        <div className="scene__hints" aria-hidden="true">
          <div className="scene__hint scene__hint--keys">
            <span className="scene__key">W</span>
            <div className="scene__key-row">
              <span className="scene__key">A</span>
              <span className="scene__key">S</span>
              <span className="scene__key">D</span>
            </div>
          </div>
          <div className="scene__hint scene__hint--mouse">
            <span className="scene__mouse-arrow">‹</span>
            <span className="scene__mouse" />
            <span className="scene__mouse-arrow">›</span>
          </div>
        </div>
      </div>
      {createPortal(children, tvHost)}
    </>
  );
}
