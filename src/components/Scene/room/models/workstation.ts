/**
 * The desk workstation against the right wall (+X): the empty desk, the office
 * chair, a small plant + the chess board + a couple of books and pens on the top.
 */
import * as THREE from 'three';
import { box, cylinder } from '../primitives';
import { COL } from '../palette';
import { ROOM_HALF } from '../constants';
import { makeChair } from './chair';
import { makePlant } from './plants';
import { makeChessSet } from '../chess/chess';
import designBookCover from '../../../../assets/images/design_of_everyday_things_cover.jpeg';

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

// like makeBook, but the top cover shows a real image (a book cover). The
// footprint is the cover's 2:3 portrait ratio so the texture isn't squished, and
// the image maps only onto the up-face (+Y); the sides/spine use `sideColor`.
function makeCoverBook(coverUrl: string, sideColor: number): THREE.Group {
  const book = new THREE.Group();
  const w = 0.15; // short edge (X)
  const d = 0.225; // long edge (Z) — w:d ≈ 0.668, the cover's aspect ratio
  const h = 0.045;
  const cover = h * 0.18;

  const texture = new THREE.TextureLoader().load(coverUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const coverMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 });
  const sideMat = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.55 });

  const pages = box(w * 0.92, h - 2 * cover, d * 0.92, 0xeee3c8, { roughness: 0.9 });
  pages.position.y = h / 2;
  book.add(pages);

  // BoxGeometry material order is +X,−X,+Y,−Y,+Z,−Z — image only on +Y (the top)
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, cover, d), [
    sideMat,
    sideMat,
    coverMat,
    sideMat,
    sideMat,
    sideMat,
  ]);
  top.castShadow = true;
  top.receiveShadow = true;
  top.position.y = h - cover / 2;
  book.add(top);

  const bottom = box(w, cover, d, sideColor, { roughness: 0.55 });
  bottom.position.y = cover / 2;
  book.add(bottom);

  // the spine stops just under the top cover (height h − cover) so it isn't
  // coplanar with the textured top face — otherwise the two z-fight and flicker
  // along that rim (harmless on a solid book, visible against the image)
  const spine = box(w * 0.05, h - cover, d, sideColor, { roughness: 0.55 });
  spine.position.set(-w / 2 + w * 0.025, (h - cover) / 2, 0);
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

  // a chess set on the RIGHT end of the desktop. Rotated so the white pieces sit
  // on the player's side (you approach the desk facing +X) with the two armies
  // running front-to-back and a1 (dark) in white's bottom-left. The board group
  // is centred on its own origin and the pieces are its children, so this spins
  // board + pieces together in place (pieces stay on their squares). Pieces load
  // at runtime.
  const chessSet = makeChessSet();
  chessSet.position.set(2.75, 0.765, 0.8); // centred on the desk depth
  // base orientation (π/2) puts white on the player's side; the extra +5° gives
  // it a slightly casual, askew placement on the desk (counter-clockwise seen
  // from above)
  chessSet.rotation.y = Math.PI / 2 + THREE.MathUtils.degToRad(5);
  scene.add(chessSet);

  // a book and a few pens in the middle of the desk so it isn't bare
  const book = makeBook(0x6b3b4a);
  book.position.set(2.82, 0.765, 0.02);
  book.rotation.y = 0.22 + Math.PI / 2;
  scene.add(book);

  // a design classic laid cover-up near the front of the desk, between the plant
  // and the room edge
  const designBook = makeCoverBook(designBookCover, 0xcdbfa6);
  designBook.position.set(2.52, 0.765, -0.55);
  designBook.rotation.y = -0.35;
  scene.add(designBook);
  [0x2f6fb0, 0xcf4b3a, 0xf2c23e].forEach((col, i) => {
    const pen = cylinder(0.006, 0.006, 0.15, col, { segments: 8 });
    pen.rotation.z = Math.PI / 2; // lie flat
    pen.rotation.y = 0.35 + i * 0.16; // fan them out
    pen.position.set(2.64, 0.771, 0.32 + i * 0.024);
    scene.add(pen);
  });
}
