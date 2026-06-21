/**
 * The desk workstation against the right wall (+X): the empty desk, the office
 * chair, a small plant + the chess board + a book and pens on the top.
 */
import * as THREE from 'three';
import { box, cylinder } from './primitives';
import { COL } from './palette';
import { ROOM_HALF } from './constants';
import { makeChair } from './chair';
import { makePlant } from './plants';
import { makeChessSet } from './chess';

// closed book lying flat, base at y=0 (cream pages between covers, spine on −X)
function makeBook(coverColor: number): THREE.Group {
  const book = new THREE.Group();
  const w = 0.22; // along X
  const d = 0.16; // along Z
  const h = 0.05; // total thickness
  const cover = h * 0.16;
  const pages = box(w * 0.92, h - 2 * cover, d * 0.92, 0xeee3c8, { roughness: 0.9 });
  pages.position.y = h / 2;
  book.add(pages);
  const bottom = box(w, cover, d, coverColor, { roughness: 0.55 });
  bottom.position.y = cover / 2;
  book.add(bottom);
  const top = box(w, cover, d, coverColor, { roughness: 0.55 });
  top.position.y = h - cover / 2;
  book.add(top);
  const spine = box(w * 0.05, h, d, coverColor, { roughness: 0.55 });
  spine.position.set(-w / 2 + w * 0.025, h / 2, 0);
  book.add(spine);
  return book;
}

export function addWorkstation(scene: THREE.Scene): void {
  // desk: built facing −Z then rotated a quarter turn so its 2.2m length runs
  // along the wall; pushed back so its rear edge meets the wall (x = ROOM_HALF)
  const desk = new THREE.Group();
  const deskTop = box(2.2, 0.05, 0.72, COL.deskTop, { roughness: 0.6 });
  deskTop.position.y = 0.74;
  desk.add(deskTop);
  for (const [x, z] of [
    [-1.0, 0.28],
    [1.0, 0.28],
    [-1.0, -0.28],
    [1.0, -0.28],
  ]) {
    const leg = box(0.06, 0.72, 0.06, COL.deskLeg, { roughness: 0.4, metalness: 0.3 });
    leg.position.set(x, 0.36, z);
    desk.add(leg);
  }
  desk.rotation.y = Math.PI / 2; // length now runs along the wall (Z)
  desk.position.set(ROOM_HALF - 0.45, 0, 0.24); // rear edge (0.72 deep) ≈ at the wall face
  scene.add(desk);

  // chair on the room side of the desk, facing it (+X toward the wall), tucked in
  // with a clear gap so it doesn't clip the desk
  const chair = makeChair();
  chair.position.set(2.0, 0, 0.0); // a little to the left along the desk, clear of it
  chair.rotation.y = Math.PI / 2 - 0.18; // swivelled a few degrees off-square, as if just left
  scene.add(chair);

  // a small potted plant on the LEFT end of the desktop
  const deskPlant = makePlant('bushy', 0.45, COL.potStone);
  deskPlant.position.set(2.75, 0.765, -0.4);
  deskPlant.rotation.y = 0.8;
  scene.add(deskPlant);

  // a chess set on the RIGHT end of the desktop, rotated so the white side
  // (local −Z) faces −X, toward the centre of the room. Pieces load at runtime.
  const chessSet = makeChessSet();
  chessSet.position.set(2.75, 0.765, 0.8); // centred on the desk depth
  chessSet.rotation.y = Math.PI / 2;
  scene.add(chessSet);

  // a book and a few pens in the middle of the desk so it isn't bare
  const book = makeBook(0x6b3b4a);
  book.position.set(2.82, 0.765, 0.02);
  book.rotation.y = 0.22 + Math.PI / 2;
  scene.add(book);
  [0x2f6fb0, 0xcf4b3a, 0xf2c23e].forEach((col, i) => {
    const pen = cylinder(0.006, 0.006, 0.15, col, { segments: 8 });
    pen.rotation.z = Math.PI / 2; // lie flat
    pen.rotation.y = 0.35 + i * 0.16; // fan them out
    pen.position.set(2.64, 0.771, 0.32 + i * 0.024);
    scene.add(pen);
  });
}
