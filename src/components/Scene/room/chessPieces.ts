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
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import pawnUrl from '../../../assets/models/pawn.glb?url';
import rookUrl from '../../../assets/models/rook.glb?url';
import knightUrl from '../../../assets/models/knight.glb?url';
import bishopUrl from '../../../assets/models/bishop.glb?url';
import queenUrl from '../../../assets/models/queen.glb?url';
import kingUrl from '../../../assets/models/king.glb?url';

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
const BOARD_TOP_Y = 0.033;

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

export async function populateChessPieces(set: THREE.Object3D): Promise<void> {
  const squareSize = set.userData.squareSize as number;
  const squareCoord = set.userData.squareCoord as (file: number, rank: number) => [number, number];
  if (!squareSize || !squareCoord) return;

  const loader = new GLTFLoader();
  const geoms: Record<string, THREE.BufferGeometry> = {};
  await Promise.all(
    Object.entries(PIECE_URLS).map(async ([type, url]) => {
      const geo = geometryOf(await loader.loadAsync(url));
      if (geo) geoms[type] = geo;
    }),
  );

  const scale = squareSize; // model is 1 unit per square
  const white = new THREE.MeshStandardMaterial({ color: 0xefe7d4, roughness: 0.55, metalness: 0.05 });
  const black = new THREE.MeshStandardMaterial({ color: 0x23262c, roughness: 0.5, metalness: 0.05 });

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
    mesh.userData = { kind: 'piece', type, color, square: FILES[file] + (rank + 1) };
    set.add(mesh);
  };

  for (let file = 0; file < 8; file++) {
    place(file, 0, BACK_RANK[file], 'white');
    place(file, 1, 'pawn', 'white');
    place(file, 6, 'pawn', 'black');
    place(file, 7, BACK_RANK[file], 'black');
  }
}
