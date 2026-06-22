/**
 * Loads the chess pieces — one self-contained .glb per piece type, split out of
 * the original model (see src/assets/models/*.glb) — and places a full set onto
 * the procedural board built by makeChessSet.
 *
 * Each piece file is already baked upright with its base at y=0 and centred over
 * its square, and the model is authored 1 unit per square, so a piece scales
 * straight onto the board's `squareSize`. The board group exposes `squareSize`
 * and `squareCoord(file,rank)` via userData (see chess.ts); pieces are added as
 * its children so they inherit the board's position/rotation on the desk.
 *
 * Returns the live set so the game controller (chessGame.ts) can move/capture
 * pieces: a `pieces` map keyed by algebraic square ('e2') and the shared
 * geometry/materials needed to spawn a promoted queen.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import pawnUrl from '../../../../assets/models/pawn.glb?url';
import rookUrl from '../../../../assets/models/rook.glb?url';
import knightUrl from '../../../../assets/models/knight.glb?url';
import bishopUrl from '../../../../assets/models/bishop.glb?url';
import queenUrl from '../../../../assets/models/queen.glb?url';
import kingUrl from '../../../../assets/models/king.glb?url';

const PIECE_URLS: Record<string, string> = {
  pawn: pawnUrl,
  rook: rookUrl,
  knight: knightUrl,
  bishop: bishopUrl,
  queen: queenUrl,
  king: kingUrl,
};
const FILES = 'abcdefgh';
const BACK_RANK = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
/** Top of the board tiles (matches the procedural board in chess.ts) */
export const BOARD_TOP_Y = 0.033;

/** Everything the game controller needs to render moves on the loaded set. */
export interface PieceAssets {
  geoms: Record<string, THREE.BufferGeometry>;
  white: THREE.Material;
  black: THREE.Material;
  scale: number;
}
export interface ChessPieces {
  /** algebraic square ('e2') → the piece mesh currently on it */
  pieces: Map<string, THREE.Mesh>;
  assets: PieceAssets;
}

/** Pull the (single) mesh geometry out of a loaded piece file, recentred. */
function geometryOf(gltf: { scene: THREE.Object3D }): THREE.BufferGeometry | null {
  gltf.scene.updateMatrixWorld(true);
  let geo: THREE.BufferGeometry | null = null;
  gltf.scene.traverse((obj) => {
    if (geo || !(obj instanceof THREE.Mesh)) return;
    const g = obj.geometry.clone();
    g.applyMatrix4(obj.matrixWorld);
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    geo = g;
  });
  return geo;
}

/**
 * Adds a view-dependent Fresnel rim to a MeshStandardMaterial: glancing-angle
 * faces (a piece's silhouette edge) pick up `color`, so each piece's outline
 * glows softly and reads against the board and its neighbours — what tells a
 * knight from a bishop is the contour. Implemented by injecting into the lit
 * shader (adds to the emissive term using the view-space normal + view dir), so
 * it costs nothing extra and survives material.clone() (the selected-piece glow).
 */
function addFresnelRim(material: THREE.MeshStandardMaterial, color: number, strength: number, power = 3) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new THREE.Color(color) };
    shader.uniforms.uRimStrength = { value: strength };
    shader.uniforms.uRimPower = { value: power };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec3 uRimColor;
uniform float uRimStrength;
uniform float uRimPower;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
{
  float rim = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), uRimPower);
  totalEmissiveRadiance += uRimColor * rim * uRimStrength;
}`,
      );
  };
}

export async function populateChessPieces(set: THREE.Object3D): Promise<ChessPieces | null> {
  const squareSize = set.userData.squareSize as number;
  const squareCoord = set.userData.squareCoord as (file: number, rank: number) => [number, number];
  if (!squareSize || !squareCoord) return null;

  const loader = new GLTFLoader();
  const geoms: Record<string, THREE.BufferGeometry> = {};
  await Promise.all(
    Object.entries(PIECE_URLS).map(async ([type, url]) => {
      const geo = geometryOf(await loader.loadAsync(url));
      if (geo) geoms[type] = geo;
    }),
  );

  const scale = squareSize; // model is 1 unit per square
  // Glossier finish (lower roughness) so the pieces catch form-revealing
  // highlights from the board light; the "black" side is a lifted graphite
  // rather than near-black for the same reason. A faint Fresnel rim outlines
  // every piece — stronger and cooler on the dark side, where it's needed most.
  const white = new THREE.MeshStandardMaterial({ color: 0xeae0cb, roughness: 0.42, metalness: 0.08 });
  const black = new THREE.MeshStandardMaterial({ color: 0x3e424a, roughness: 0.34, metalness: 0.12 });
  addFresnelRim(white, 0xfff4e0, 0.28);
  addFresnelRim(black, 0xb0bece, 0.85);

  const pieces = new Map<string, THREE.Mesh>();
  const place = (file: number, rank: number, type: string, color: 'white' | 'black') => {
    const geo = geoms[type];
    if (!geo) return;
    const mesh = new THREE.Mesh(geo, color === 'white' ? white : black);
    mesh.scale.setScalar(scale);
    const [x, z] = squareCoord(file, rank);
    mesh.position.set(x, BOARD_TOP_Y, z);
    if (color === 'black') mesh.rotation.y = Math.PI; // face the opposing side
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const square = FILES[file] + (rank + 1);
    mesh.userData = { kind: 'piece', type, color, square };
    set.add(mesh);
    pieces.set(square, mesh);
  };

  for (let file = 0; file < 8; file++) {
    place(file, 0, BACK_RANK[file], 'white');
    place(file, 1, 'pawn', 'white');
    place(file, 6, 'pawn', 'black');
    place(file, 7, BACK_RANK[file], 'black');
  }

  return { pieces, assets: { geoms, white, black, scale } };
}
