/**
 * The chess board (pieces load from GLTF at runtime — chessPieces.ts). The
 * structure is queryable because chessGame.ts drives a real game on it: the
 * group is named 'chessSet' with userData.squareSize/squareCoord, and each
 * tile carries userData.square ('e4').
 */
import * as THREE from 'three';
import { box } from '../primitives';

export const CHESS_SQ = 0.07; // square size (m)
const FILES = 'abcdefgh';

export function squareCoord(file: number, rank: number): [number, number] {
  // file axis negated so the board isn't mirrored: a1 (dark) lands on white's
  // left, as the rules require ("light square on the right")
  return [(3.5 - file) * CHESS_SQ, (rank - 3.5) * CHESS_SQ];
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
