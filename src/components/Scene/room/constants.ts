/**
 * Shared room constants. The exported ones are part of the contract Scene.tsx
 * relies on (camera framing, walkable bounds, TV placement); the rest are
 * internal room dimensions used across the room/* modules.
 */
import * as THREE from 'three';

/** Walkable area (room is 6.4×6.4m, walls at ±3.2) */
export const BOUNDS = { minX: -2.72, maxX: 2.72, minZ: -2.56, maxZ: 2.48 };
export const EYE_HEIGHT = 1.6;

/** Where the camera ends up after "getting off the couch" */
export const STANDING_SPOT = new THREE.Vector3(0, EYE_HEIGHT, 0.56);

/** World units per CSS pixel: the 920px-wide DOM cabinet ≈ 1.1m */
export const WORLD_PER_PX = 1.1 / 920;
/** Z of the TV's front plane (the DOM face) — the wall is at −3.2 */
export const TV_FRONT_Z = -2.68;
/** Top of the TV stand: the DOM TV's feet rest here */
export const STAND_TOP_Y = 0.5;

/** FOV at the closeup (website) framing; widens while walking */
export const CLOSEUP_FOV = 55;
export const WALKING_FOV = 70;

// Room shrunk 20% in width/depth (8→6.4) to feel more cramped; interior objects
// keep their real size but were moved in proportionally. Ceiling height is
// unchanged.
export const ROOM_HALF = 3.2;
export const CEILING_Y = 3.2;
/** Wall thickness — walls are solid slabs (not planes) so the shell is
 *  watertight: corners and floor/ceiling joints overlap, no light leaks */
export const WALL_T = 0.15;
