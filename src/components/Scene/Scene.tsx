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
} from './room/buildRoom';
import { createFlightController } from './cameraFlight';
import type { ChessGame } from './room/chess/chessGame';
import { setupPainting } from './room/painting/painting';
import './Scene.scss';

/** Camera pull-back after powering off (seconds) */
const ENTER_DURATION = 1.9;
/** Camera fly-in after clicking the TV in the room (seconds) */
const LEAVE_DURATION = 1.15;
const WALK_SPEED = 3;
/** Max distance (m) from which the TV can be clicked */
const TV_REACH = 4;
/** Max distance (m) from which the easel canvas / palette can be used */
const PAINT_REACH = 3;
/** Max distance (m) from which the short-story paper can be picked up */
const PAPER_REACH = 3;
/** Fraction of the viewport the DOM TV fills at the closeup framing */
const FIT_HEIGHT = 0.82;
const FIT_WIDTH = 0.9;

export type ViewMode = 'tv' | 'to-room' | 'room' | 'to-tv';

interface SceneProps {
  mode: ViewMode;
  storyOpen: boolean;
  onArrivedInRoom: () => void;
  onArrivedAtTV: () => void;
  onTVClicked: () => void;
  onPaperClicked: () => void;
  /** The DOM TV (TVSet) — projected onto the 3D TV body via CSS3D */
  children: ReactNode;
}

function quaternionLookingAt(from: THREE.Vector3, target: THREE.Vector3): THREE.Quaternion {
  const matrix = new THREE.Matrix4().lookAt(from, target, new THREE.Vector3(0, 1, 0));
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

/**
 * The three.js room containing the TV. The TV's front face is the real DOM
 * website (CSS3DRenderer); "website mode" is just the camera parked in front
 * of it, which is what makes the power-off pull-back seamless.
 */
export function Scene({
  mode,
  storyOpen,
  onArrivedInRoom,
  onArrivedAtTV,
  onTVClicked,
  onPaperClicked,
  children,
}: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    flyToRoom: () => void;
    flyToTV: () => void;
    relockPointer: () => void;
    loadChess: () => void;
  } | null>(null);

  // detached host div for the DOM TV; CSS3DRenderer adopts it
  const [tvHost] = useState(() => {
    const host = document.createElement('div');
    host.className = 'scene__tv-host';
    return host;
  });

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const storyOpenRef = useRef(storyOpen);
  storyOpenRef.current = storyOpen;
  const callbacksRef = useRef({ onArrivedInRoom, onArrivedAtTV, onTVClicked, onPaperClicked });
  callbacksRef.current = { onArrivedInRoom, onArrivedAtTV, onTVClicked, onPaperClicked };

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
    const painter = setupPainting(scene);
    const storyPaper = scene.getObjectByName('storyPaper');

    const tvObject = new CSS3DObject(tvHost);
    tvObject.scale.setScalar(WORLD_PER_PX);
    cssScene.add(tvObject);

    // Render-on-demand: only draw when the camera/world changed. The DOM TV's
    // own motion lives in the CSS3D layer and animates without a three render.
    let needsRender = true;

    // Chess pulls in chess.js + the GLTF pieces, and the board isn't in view
    // until the first power-off — so load it lazily then (a separate chunk).
    let chessGame: ChessGame | null = null;
    let chessRequested = false;
    const loadChess = () => {
      if (chessRequested) return;
      chessRequested = true;
      const chessSet = scene.getObjectByName('chessSet');
      if (!chessSet) return;
      Promise.all([import('./room/chess/chessPieces'), import('./room/chess/chessGame')])
        .then(([{ populateChessPieces }, { createChessGame }]) =>
          populateChessPieces(chessSet).then((loaded) => {
            if (loaded) {
              chessGame = createChessGame(chessSet, loaded, () => {
                needsRender = true;
              });
            }
            needsRender = true;
          }),
        )
        .catch((error) => console.error('chess failed to load', error));
    };

    // Measures the DOM TV and aligns the 3D world to it: the CSS3D object, the
    // wooden body behind the cabinet, and the closeup camera framing.
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
      // thin front slab behind the DOM bezel; the CRT rear shell provides depth
      const bodyDepth = 0.16;
      tvBody.scale.set(cabinetWidth - 2 * cornerInset, cabinetHeight - 2 * cornerInset, bodyDepth);
      tvBody.position.set(0, cabinetCenterY, TV_FRONT_Z - bodyDepth / 2 - 0.001);

      // closeup framing: cabinet fills FIT_HEIGHT/FIT_WIDTH of the viewport
      const halfFovTan = Math.tan(THREE.MathUtils.degToRad(CLOSEUP_FOV / 2));
      const distanceForHeight = cabinetHeight / 2 / (FIT_HEIGHT * halfFovTan);
      const distanceForWidth = cabinetWidth / 2 / (FIT_WIDTH * halfFovTan * camera.aspect);
      const distance = Math.max(distanceForHeight, distanceForWidth);
      closeupTarget.set(0, cabinetCenterY, TV_FRONT_Z);
      closeupPosition.set(0, cabinetCenterY, TV_FRONT_Z + distance);

      // keep the website framing locked while parked in front of the TV
      if (modeRef.current === 'tv' && !flight.active) {
        camera.position.copy(closeupPosition);
        camera.quaternion.copy(quaternionLookingAt(closeupPosition, closeupTarget));
        camera.fov = CLOSEUP_FOV;
        camera.updateProjectionMatrix();
      }
      needsRender = true;
    };

    const controls = new PointerLockControls(camera, renderer.domElement);
    const raycaster = new THREE.Raycaster();
    const screenCenter = new THREE.Vector2(0, 0);
    const keys = new Set<string>();
    const flight = createFlightController(camera);
    let isPainting = false; // mouse button held while aiming at the easel canvas

    const showCrosshair = (visible: boolean) =>
      crosshairRef.current?.classList.toggle('scene__crosshair--visible', visible);

    /** Nearest raycast hit on `object` is within `reach` metres. */
    const hitWithin = (object: THREE.Object3D, reach: number) => {
      const hit = raycaster.intersectObject(object, true)[0];
      return !!hit && hit.distance <= reach;
    };

    apiRef.current = {
      flyToRoom: () => {
        flight.start(
          STANDING_SPOT,
          quaternionLookingAt(STANDING_SPOT, closeupTarget),
          WALKING_FOV,
          ENTER_DURATION,
          () => {
            showCrosshair(controls.isLocked);
            callbacksRef.current.onArrivedInRoom();
          },
        );
        // lock now, while the PWR click's user activation is still fresh —
        // mouselook is then live the moment the flight lands
        controls.lock();
      },
      flyToTV: () => {
        // set the flight before unlocking so the unlock handler stays quiet
        flight.start(
          closeupPosition,
          quaternionLookingAt(closeupPosition, closeupTarget),
          CLOSEUP_FOV,
          LEAVE_DURATION,
          () => callbacksRef.current.onArrivedAtTV(),
        );
        controls.unlock();
        showCrosshair(false);
      },
      // re-lock after closing the story (its close click's activation is fresh)
      relockPointer: () => {
        if (modeRef.current === 'room' && !controls.isLocked) controls.lock();
      },
      loadChess,
    };

    const onClick = () => {
      if (flight.active || modeRef.current !== 'room') return;
      if (!controls.isLocked) {
        controls.lock();
        return;
      }
      raycaster.setFromCamera(screenCenter, camera);
      if (chessGame?.tryClick(raycaster)) return;
      // the story paper: free the cursor so the reader can scroll
      if (storyPaper && hitWithin(storyPaper, PAPER_REACH)) {
        controls.unlock();
        showCrosshair(false);
        callbacksRef.current.onPaperClicked();
        return;
      }
      if (hitWithin(tvGroup, TV_REACH)) callbacksRef.current.onTVClicked();
    };
    container.addEventListener('click', onClick);

    // Painting: pointer-down on a palette dab swaps the brush colour; on the
    // canvas it starts a stroke. The stroke itself continues in the loop so
    // dragging the crosshair draws continuously.
    const onPointerDown = () => {
      if (flight.active || modeRef.current !== 'room' || !controls.isLocked || !painter) return;
      raycaster.setFromCamera(screenCenter, camera);
      const dab = raycaster.intersectObjects(painter.dabs, false)[0];
      if (dab && dab.distance <= PAINT_REACH) {
        painter.setColor(dab.object.userData.paintColor);
        return;
      }
      const canvasHit = raycaster.intersectObject(painter.surface, false)[0];
      if (canvasHit?.uv && canvasHit.distance <= PAINT_REACH) {
        isPainting = true;
        painter.liftBrush();
        painter.paint(canvasHit.uv);
      }
    };
    const onPointerUp = () => {
      if (!isPainting) return;
      isPainting = false;
      painter?.liftBrush();
    };
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    const onLock = () => {
      // during the to-room flight the crosshair waits for arrival
      showCrosshair(modeRef.current === 'room');
    };
    const onUnlock = () => {
      showCrosshair(false);
    };
    controls.addEventListener('lock', onLock);
    controls.addEventListener('unlock', onUnlock);

    const onKeyDown = (event: KeyboardEvent) => {
      keys.add(event.code);
      // Enter returns to the TV — keyboard-only visitors can't click it
      // (that needs a pointer-locked mouse) and would otherwise be stranded.
      if (
        event.code === 'Enter' &&
        modeRef.current === 'room' &&
        !flight.active &&
        !storyOpenRef.current
      ) {
        callbacksRef.current.onTVClicked();
      }
    };
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

      if (flight.update(delta)) {
        needsRender = true;
      } else if (controls.isLocked) {
        needsRender = true;
        const forward = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
        const sideways = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
        if (forward) controls.moveForward(forward * WALK_SPEED * delta);
        if (sideways) controls.moveRight(sideways * WALK_SPEED * delta);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, BOUNDS.minX, BOUNDS.maxX);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, BOUNDS.minZ, BOUNDS.maxZ);
        camera.position.y = EYE_HEIGHT;

        raycaster.setFromCamera(screenCenter, camera);

        // painting continues while the button is held, wherever the crosshair is
        if (painter && isPainting) {
          const stroke = raycaster.intersectObject(painter.surface, false)[0];
          if (stroke?.uv && stroke.distance <= PAINT_REACH) painter.paint(stroke.uv);
          else painter.liftBrush(); // wandered off the canvas: break the stroke
        }

        // crosshair turns amber over anything interactive
        const targetable =
          hitWithin(tvGroup, TV_REACH) ||
          !!chessGame?.isInteractive(raycaster) ||
          (!!storyPaper && hitWithin(storyPaper, PAPER_REACH)) ||
          (!!painter &&
            [painter.surface, ...painter.dabs].some((target) => hitWithin(target, PAINT_REACH)));
        crosshairRef.current?.classList.toggle('scene__crosshair--target', targetable);
      }

      // chess animations drive their own frames while a piece is sliding
      if (chessGame?.update(delta)) needsRender = true;

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
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
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

  useEffect(() => {
    if (mode === 'to-room') {
      // first power-off: pull the chess chunk in while the camera flies back
      apiRef.current?.loadChess();
      apiRef.current?.flyToRoom();
    }
    if (mode === 'to-tv') apiRef.current?.flyToTV();
    const parked = mode === 'tv';
    tvHost.style.pointerEvents = parked ? 'auto' : 'none';
    // `inert` (not just pointer-events) so the TV can't keep keyboard focus
    // while walking — a still-focused PWR button would otherwise toggle power
    // on Space/Enter and yank the camera back.
    tvHost.inert = !parked;
  }, [mode, tvHost]);

  // closing the story reader re-establishes pointer lock (no-op unless walking)
  const storyWasOpen = useRef(storyOpen);
  useEffect(() => {
    if (storyWasOpen.current && !storyOpen) apiRef.current?.relockPointer();
    storyWasOpen.current = storyOpen;
  }, [storyOpen]);

  return (
    <>
      <div ref={containerRef} className={`scene ${mode === 'room' ? 'scene--walking' : ''}`}>
        <div ref={crosshairRef} className="scene__crosshair" aria-hidden="true" />

        {/* control hints, mirroring hand positions: keys left, mouse right */}
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
