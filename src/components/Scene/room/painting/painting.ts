/**
 * Makes the easel canvas paintable. artCorner builds a 'canvasSurface' plane
 * (and palette dabs each carrying userData.paintColor); this backs that plane
 * with a CanvasTexture you draw onto by aiming the room crosshair at it and
 * holding the mouse button (the raycast hands us the UV hit point). Clicking a
 * dab swaps the brush colour. Default colour is red.
 *
 * Scene.tsx owns the input/raycasting; this just exposes the surface, the dab
 * meshes to test against, and the draw operations.
 */
import * as THREE from 'three';

const TEX_PX = 1024; // paint texture resolution (power-of-two for mipmaps)
const BASE_COAT = '#fbf8f1'; // matches the unpainted canvas colour
const DEFAULT_COLOR = '#d13b3b'; // red — same as the first palette dab

export interface Painter {
  /** the canvas plane to raycast for brush strokes */
  surface: THREE.Mesh;
  /** the palette colour dabs to raycast for colour switching */
  dabs: THREE.Mesh[];
  /** lay paint where the crosshair hit the canvas (uv from the raycast) */
  paint(uv: THREE.Vector2): void;
  /** end the current stroke so the next one doesn't connect back to it */
  liftBrush(): void;
  /** load a new brush colour */
  setColor(color: THREE.ColorRepresentation): void;
}

export function setupPainting(scene: THREE.Scene): Painter | null {
  const surface = scene.getObjectByName('canvasSurface') as THREE.Mesh | null;
  if (!surface) return null;

  const dabs: THREE.Mesh[] = [];
  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh && object.userData.paintColor !== undefined) {
      dabs.push(object as THREE.Mesh);
    }
  });

  const canvas = document.createElement('canvas');
  canvas.width = TEX_PX;
  canvas.height = TEX_PX;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = BASE_COAT;
  ctx.fillRect(0, 0, TEX_PX, TEX_PX);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  // the surface material is unique to this mesh (not from the shared primitives
  // cache), so mutating it is safe. White base colour lets the texture show its
  // true colours.
  const material = surface.material as THREE.MeshStandardMaterial;
  material.map = texture;
  material.color.set('#ffffff');
  material.needsUpdate = true;

  let color = DEFAULT_COLOR;
  let last: { x: number; y: number } | null = null;
  const brush = TEX_PX * 0.02;

  return {
    surface,
    dabs,
    paint(uv) {
      const x = uv.x * TEX_PX;
      const y = (1 - uv.y) * TEX_PX; // canvas Y is top-down, UV is bottom-up
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = brush * 2;
      ctx.lineCap = 'round';
      if (last) {
        // connect to the last point so dragging draws a continuous stroke
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, brush, 0, Math.PI * 2);
        ctx.fill();
      }
      last = { x, y };
      texture.needsUpdate = true;
    },
    liftBrush() {
      last = null;
    },
    setColor(next) {
      color = `#${new THREE.Color(next).getHexString()}`;
    },
  };
}
