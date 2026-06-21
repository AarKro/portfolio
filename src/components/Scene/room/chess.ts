/**
 * The chess board (the 32 pieces are loaded from GLTF at runtime — see
 * chessPieces.ts). Built to be made into a real game later, so the structure is
 * queryable rather than baked:
 *   • the returned group is named 'chessSet' and carries userData.squareSize +
 *     userData.squareCoord(file,rank) → local (x,z) of a square centre
 *   • each square tile is in the 'squares' subgroup with userData.square ('e4')
 *   • each loaded piece mesh has userData = { kind:'piece', type, color, square }
 * Future logic can getObjectByName('chessSet'), read these, and move the piece
 * meshes between squareCoord() positions.
 */
import * as THREE from 'three';
import { box } from './primitives';

export const CHESS_SQ = 0.07; // square size (m)
const FILES = 'abcdefgh';

export function squareCoord(file: number, rank: number): [number, number] {
  return [(file - 3.5) * CHESS_SQ, (rank - 3.5) * CHESS_SQ];
}

export function makeChessSet(): THREE.Group {
  const set = new THREE.Group();
  set.name = 'chessSet';
  set.userData = { kind: 'chessSet', squareSize: CHESS_SQ, squareCoord };

  // base board with a thin frame
  const span = CHESS_SQ * 8;
  const frame = box(span + 0.05, 0.025, span + 0.05, 0x3a2a1c, { roughness: 0.5 });
  frame.position.y = 0.0125;
  set.add(frame);

  const squares = new THREE.Group();
  squares.name = 'squares';
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const isLight = (file + rank) % 2 === 1;
      const tile = box(CHESS_SQ, 0.012, CHESS_SQ, isLight ? 0xead9b0 : 0x8a5a32, { roughness: 0.6 });
      const [x, z] = squareCoord(file, rank);
      tile.position.set(x, 0.027, z);
      tile.userData = { square: FILES[file] + (rank + 1) };
      squares.add(tile);
    }
  }
  set.add(squares);
  return set;
}
