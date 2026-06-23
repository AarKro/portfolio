/**
 * A printed sheet of the short story "Ich." resting on the couch. It's a click
 * target like the TV: Scene.tsx finds it by name ('storyPaper'), turns the
 * crosshair amber when it's in reach, and opens the DOM reader on click.
 *
 * The page face carries a CanvasTexture of the title + faux body lines, so from
 * across the room it reads as a written manuscript and invites the click.
 */
import * as THREE from 'three';

/** A4-ish sheet, in metres (lying on the couch). */
const SHEET_W = 0.22;
const SHEET_H = 0.31;

/** Couch sits at (−1.5, 0, 1.25) facing the TV; this rests on its right cushion,
 *  raised to the seat top and given a casual skew. Nudge Y if it floats/sinks. */
const PAPER_POS = new THREE.Vector3(-1.12, 0.5, 1.46);
const PAPER_YAW = Math.PI - THREE.MathUtils.degToRad(40) + THREE.MathUtils.degToRad(18);

/** Paint the page: cream stock, the real title/byline, then grey faux text. */
function makePageTexture(): THREE.CanvasTexture {
  const w = 460;
  const h = Math.round((w * SHEET_H) / SHEET_W);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f4eee1';
  ctx.fillRect(0, 0, w, h);

  const margin = w * 0.12;
  ctx.fillStyle = '#2a241c';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${Math.round(w * 0.12)}px Georgia, 'Times New Roman', serif`;
  ctx.fillText('Ich.', margin, h * 0.16);

  ctx.fillStyle = '#8a7f6b';
  ctx.font = `italic ${Math.round(w * 0.045)}px Georgia, serif`;
  ctx.fillText('Eine Kurzgeschichte', margin, h * 0.215);

  // faux body: rows of soft-grey bars, with the odd short line to fake paragraphs
  const lineH = h * 0.032;
  let y = h * 0.29;
  ctx.fillStyle = '#cdc4b2';
  for (let row = 0; row < 22 && y < h - margin; row++) {
    const short = row % 7 === 6; // ragged paragraph endings
    const width = (w - margin * 2) * (short ? 0.35 + (row % 3) * 0.08 : 0.82 + (row % 3) * 0.06);
    ctx.fillRect(margin, y, Math.min(width, w - margin * 2), lineH * 0.45);
    y += lineH + (short ? lineH * 0.6 : 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function addPaper(scene: THREE.Scene): void {
  const paper = new THREE.Group();
  paper.name = 'storyPaper';

  // printed face (up)
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(SHEET_W, SHEET_H),
    new THREE.MeshStandardMaterial({ map: makePageTexture(), roughness: 0.92 }),
  );
  face.rotation.x = -Math.PI / 2; // lay flat, printed side up
  face.position.y = 0.002; // float a hair above the backing to avoid z-fighting
  face.receiveShadow = true;
  paper.add(face);

  // thin paper backing so the sheet has body and casts a soft shadow
  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(SHEET_W, 0.002, SHEET_H),
    new THREE.MeshStandardMaterial({ color: 0xe9e1d0, roughness: 0.95 }),
  );
  backing.castShadow = true;
  backing.receiveShadow = true;
  paper.add(backing);

  paper.position.copy(PAPER_POS);
  paper.rotation.y = PAPER_YAW;
  scene.add(paper);
}
