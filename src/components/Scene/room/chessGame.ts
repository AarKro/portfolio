/**
 * A real, playable chess game on the 3D board. The player has the white pieces;
 * a rudimentary alpha-beta AI plays black. Rules + move legality come from
 * chess.js — we never reinvent them; this module only drives the 3D side:
 * raycast clicks → selection, light up legal target squares, slide/capture the
 * piece meshes, and animate the AI's reply.
 *
 * Interaction (crosshair, while walking the room):
 *   • click a white piece  → it's selected, its legal destinations light up
 *   • click a lit square   → the move is played (incl. captures, castling,
 *                            en passant, auto-queen promotion), then black replies
 *   • click elsewhere      → deselect
 *
 * The board group exposes squareSize + squareCoord() (see chess.ts) and holds
 * the piece meshes as children, so everything here works in the board's local
 * space and inherits its placement/rotation on the desk.
 */
import * as THREE from 'three';
import { Chess } from 'chess.js';
import { BOARD_TOP_Y, type ChessPieces } from './chessPieces';

const FILES = 'abcdefgh';
/** How close (m) the crosshair hit must be for a click to count as "at the board" */
const REACH = 2.2;
/** Plies the AI looks ahead (its own move + this many replies). Higher = stronger/slower. */
const SEARCH_DEPTH = 3;
const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const CHECKMATE = 1000;
/** Seconds for a piece to glide between squares */
const MOVE_DURATION = 0.34;
/** Height (m) of the little hop a moving piece makes, so it clears its neighbours */
const HOP = 0.045;

export interface ChessGame {
  /** Resolve a crosshair click; returns true if it was a chess interaction (consumed). */
  tryClick(raycaster: THREE.Raycaster): boolean;
  /** Is the crosshair currently over something the player could click? (crosshair feedback) */
  isInteractive(raycaster: THREE.Raycaster): boolean;
  /** Advance animations; returns true while a frame still needs drawing. */
  update(delta: number): boolean;
}

const easeInOut = (t: number) => t * t * (3 - 2 * t);

interface Tween {
  mesh: THREE.Mesh;
  from: THREE.Vector3;
  to: THREE.Vector3;
  elapsed: number;
  onDone?: () => void;
}

export function createChessGame(
  set: THREE.Object3D,
  loaded: ChessPieces,
  requestRender: () => void,
): ChessGame {
  const { pieces, assets } = loaded;
  const squareCoord = set.userData.squareCoord as (file: number, rank: number) => [number, number];
  const chess = new Chess();

  // a highlighted-target material/geometry, reused across all the glowing discs
  const discGeo = new THREE.CircleGeometry(assets.scale * 0.3, 24);
  const moveMat = new THREE.MeshBasicMaterial({
    color: 0x46e07a,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const captureMat = new THREE.MeshBasicMaterial({
    color: 0xe0563c,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
  });
  // a glowing copy of the white material for the currently-selected piece
  const selectedMat = (assets.white as THREE.MeshStandardMaterial).clone();
  selectedMat.emissive = new THREE.Color(0x2f8f4a);
  selectedMat.emissiveIntensity = 0.9;

  const highlights = new THREE.Group();
  highlights.name = 'chessHighlights';
  set.add(highlights);

  let selected: string | null = null; // selected square, or null
  let legalTargets = new Map<string, boolean>(); // target square → isCapture
  let busy = false; // a move (player + AI reply) is in flight; ignore clicks
  const tweens: Tween[] = [];

  /** Local board position of an algebraic square ('e4'). */
  function localOf(square: string): THREE.Vector3 {
    const file = FILES.indexOf(square[0]);
    const rank = Number(square[1]) - 1;
    const [x, z] = squareCoord(file, rank);
    return new THREE.Vector3(x, BOARD_TOP_Y, z);
  }

  function clearSelection() {
    if (selected) {
      const mesh = pieces.get(selected);
      if (mesh) mesh.material = assets.white; // restore (only white is ever selected)
    }
    selected = null;
    legalTargets = new Map();
    highlights.clear();
  }

  function select(square: string) {
    clearSelection();
    const mesh = pieces.get(square);
    if (!mesh) return;
    selected = square;
    mesh.material = selectedMat;

    const moves = chess.moves({ square: square as never, verbose: true }) as Array<{
      to: string;
      flags: string;
    }>;
    for (const move of moves) {
      const isCapture = move.flags.includes('c') || move.flags.includes('e');
      legalTargets.set(move.to, isCapture);
      const disc = new THREE.Mesh(discGeo, isCapture ? captureMat : moveMat);
      disc.rotation.x = -Math.PI / 2; // lie flat on the board
      const pos = localOf(move.to);
      disc.position.set(pos.x, BOARD_TOP_Y + 0.002, pos.z);
      disc.userData = { square: move.to };
      highlights.add(disc);
    }
    requestRender();
  }

  function animateTo(mesh: THREE.Mesh, square: string, onDone?: () => void) {
    tweens.push({ mesh, from: mesh.position.clone(), to: localOf(square), elapsed: 0, onDone });
  }

  function removePiece(square: string) {
    const mesh = pieces.get(square);
    if (!mesh) return;
    set.remove(mesh); // geometry + material are shared, so don't dispose them
    pieces.delete(square);
  }

  /** Replace a just-moved pawn mesh with a queen of the same colour (auto-promotion). */
  function promote(square: string, color: 'w' | 'b') {
    removePiece(square);
    const queen = new THREE.Mesh(assets.geoms.queen, color === 'w' ? assets.white : assets.black);
    queen.scale.setScalar(assets.scale);
    const pos = localOf(square);
    queen.position.copy(pos);
    if (color === 'b') queen.rotation.y = Math.PI;
    queen.castShadow = true;
    queen.receiveShadow = true;
    queen.userData = { kind: 'piece', type: 'queen', color: color === 'w' ? 'white' : 'black', square };
    set.add(queen);
    pieces.set(square, queen);
  }

  /**
   * Reflect a chess.js move on the 3D board: remove any captured piece, glide
   * the moving piece (and the rook, when castling), and auto-queen promotions.
   * `onComplete` fires when the primary piece finishes sliding.
   */
  function reconcileMove(
    done: { from: string; to: string; color: 'w' | 'b'; flags: string; captured?: string },
    onComplete?: () => void,
  ) {
    const mover = pieces.get(done.from);
    pieces.delete(done.from);

    if (done.flags.includes('e')) {
      // en passant: the captured pawn sits behind the destination square
      removePiece(done.to[0] + done.from[1]);
    } else if (done.captured) {
      removePiece(done.to);
    }

    if (mover) {
      pieces.set(done.to, mover);
      mover.userData.square = done.to;
      animateTo(mover, done.to, () => {
        if (done.flags.includes('p')) promote(done.to, done.color);
        onComplete?.();
      });
    } else {
      onComplete?.();
    }

    // castling also slides the rook to the far side of the king
    if (done.flags.includes('k') || done.flags.includes('q')) {
      const rank = done.to[1];
      const [rookFrom, rookTo] = done.flags.includes('k')
        ? [`h${rank}`, `f${rank}`]
        : [`a${rank}`, `d${rank}`];
      const rook = pieces.get(rookFrom);
      if (rook) {
        pieces.delete(rookFrom);
        pieces.set(rookTo, rook);
        rook.userData.square = rookTo;
        animateTo(rook, rookTo);
      }
    }
  }

  function announceIfOver(): boolean {
    if (!chess.isGameOver()) return false;
    let message: string;
    if (chess.isCheckmate()) {
      message = chess.turn() === 'b' ? 'Checkmate — you win! 🎉' : 'Checkmate — black wins.';
    } else if (chess.isStalemate()) {
      message = 'Stalemate — draw.';
    } else if (chess.isThreefoldRepetition()) {
      message = 'Draw by threefold repetition.';
    } else if (chess.isInsufficientMaterial()) {
      message = 'Draw — insufficient material.';
    } else {
      message = 'Draw.';
    }
    setTimeout(() => alert(message), 60); // let the final slide paint first
    return true;
  }

  // ── the rudimentary AI (black) ─────────────────────────────────────────────
  function evaluate(): number {
    let score = 0; // +ve favours white
    for (const row of chess.board()) {
      for (const piece of row) {
        if (piece) score += (piece.color === 'w' ? 1 : -1) * PIECE_VALUE[piece.type];
      }
    }
    return score;
  }

  function search(depth: number, alpha: number, beta: number): number {
    if (chess.isCheckmate()) return chess.turn() === 'w' ? -CHECKMATE : CHECKMATE;
    if (chess.isGameOver()) return 0; // draw
    if (depth === 0) return evaluate();

    const maximizing = chess.turn() === 'w';
    const moves = chess.moves({ verbose: true });
    let best = maximizing ? -Infinity : Infinity;
    for (const move of moves) {
      chess.move(move);
      const value = search(depth - 1, alpha, beta);
      chess.undo();
      if (maximizing) {
        best = Math.max(best, value);
        alpha = Math.max(alpha, value);
      } else {
        best = Math.min(best, value);
        beta = Math.min(beta, value);
      }
      if (beta <= alpha) break; // alpha-beta cutoff
    }
    return best;
  }

  function chooseBlackMove() {
    const moves = chess.moves({ verbose: true });
    // shuffle so equal-scoring moves vary game to game
    for (let i = moves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    let best = moves[0];
    let bestScore = Infinity; // black minimises white's advantage
    for (const move of moves) {
      chess.move(move);
      const score = search(SEARCH_DEPTH - 1, -Infinity, Infinity) + (Math.random() * 0.06 - 0.03);
      chess.undo();
      if (score < bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best;
  }

  function playBlack() {
    const move = chooseBlackMove();
    if (!move) {
      busy = false;
      return;
    }
    const done = chess.move(move);
    reconcileMove(done, () => {
      busy = false;
      announceIfOver();
    });
    requestRender();
  }

  function playWhite(from: string, to: string) {
    busy = true;
    clearSelection();
    const done = chess.move({ from, to, promotion: 'q' });
    reconcileMove(done, () => {
      if (announceIfOver()) {
        busy = false;
        return;
      }
      setTimeout(playBlack, 300); // a beat, so black feels like it "thinks"
    });
  }

  // ── interaction ────────────────────────────────────────────────────────────
  /** Nearest in-reach hit among the highlight discs and the piece meshes. */
  function pick(raycaster: THREE.Raycaster): THREE.Intersection | null {
    const hits = raycaster.intersectObjects([...highlights.children, ...pieces.values()], false);
    const hit = hits.find((h) => h.distance <= REACH);
    return hit ?? null;
  }

  function tryClick(raycaster: THREE.Raycaster): boolean {
    if (busy || chess.turn() !== 'w') return false;
    const hit = pick(raycaster);

    if (selected) {
      if (!hit) {
        clearSelection();
        return true; // consume: clicking away cancels the selection
      }
      const square = hit.object.userData.square as string;
      if (legalTargets.has(square)) {
        playWhite(selected, square);
        return true;
      }
      const piece = chess.get(square as never);
      if (piece && piece.color === 'w') {
        select(square); // re-select another of the player's pieces
        return true;
      }
      clearSelection();
      return true;
    }

    if (!hit) return false; // nothing of ours under the crosshair — let other clicks through
    const square = hit.object.userData.square as string;
    const piece = chess.get(square as never);
    if (piece && piece.color === 'w') {
      select(square);
      return true;
    }
    return true; // clicked a black piece at the board — consume so it doesn't reach the TV
  }

  function isInteractive(raycaster: THREE.Raycaster): boolean {
    if (busy || chess.turn() !== 'w') return false;
    const hit = pick(raycaster);
    if (!hit) return false;
    const square = hit.object.userData.square as string;
    if (selected) return legalTargets.has(square) || chess.get(square as never)?.color === 'w';
    return chess.get(square as never)?.color === 'w';
  }

  function update(delta: number): boolean {
    if (tweens.length === 0) return false;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tween = tweens[i];
      tween.elapsed += delta;
      const t = Math.min(tween.elapsed / MOVE_DURATION, 1);
      const eased = easeInOut(t);
      tween.mesh.position.lerpVectors(tween.from, tween.to, eased);
      tween.mesh.position.y = THREE.MathUtils.lerp(tween.from.y, tween.to.y, eased) + Math.sin(t * Math.PI) * HOP;
      if (t >= 1) {
        tweens.splice(i, 1);
        tween.onDone?.();
      }
    }
    return true; // a tween moved this frame — keep drawing
  }

  return { tryClick, isInteractive, update };
}
