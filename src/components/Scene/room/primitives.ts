/**
 * Tiny mesh factories shared by the room/* builders. All cast + receive shadows.
 *
 * Identical geometries and materials are cached and shared, so the room builds
 * and first-paints cheaply: e.g. the 64 chess tiles reference a single
 * BoxGeometry + two materials rather than 64 of each, and every wood/metal/leaf
 * surface of the same colour shares one material. Keys come from the
 * construction params. This is safe because the room never mutates a
 * primitive's material or geometry after creation (verified), and three.js
 * happily shares both across any number of meshes.
 */
import * as THREE from 'three';

const geometryCache = new Map<string, THREE.BufferGeometry>();
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function geometry<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let geo = geometryCache.get(key) as T | undefined;
  if (!geo) {
    geo = make();
    geometryCache.set(key, geo);
  }
  return geo;
}

function standardMaterial(
  color: number,
  roughness: number,
  metalness: number,
  flatShading: boolean,
): THREE.MeshStandardMaterial {
  const key = `${color}:${roughness}:${metalness}:${flatShading ? 1 : 0}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading });
    materialCache.set(key, mat);
  }
  return mat;
}

export function box(
  w: number,
  h: number,
  d: number,
  color: number,
  opts: { roughness?: number; metalness?: number } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    geometry(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)),
    standardMaterial(color, opts.roughness ?? 0.85, opts.metalness ?? 0, false),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cylinder(
  rTop: number,
  rBottom: number,
  h: number,
  color: number,
  opts: { roughness?: number; metalness?: number; segments?: number } = {},
): THREE.Mesh {
  const segments = opts.segments ?? 18;
  const mesh = new THREE.Mesh(
    geometry(
      `cyl:${rTop}:${rBottom}:${h}:${segments}`,
      () => new THREE.CylinderGeometry(rTop, rBottom, h, segments),
    ),
    standardMaterial(color, opts.roughness ?? 0.8, opts.metalness ?? 0, false),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function sphere(
  r: number,
  color: number,
  opts: { roughness?: number; metalness?: number; flatShading?: boolean } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    geometry(`sph:${r}`, () => new THREE.SphereGeometry(r, 16, 12)),
    standardMaterial(color, opts.roughness ?? 0.6, opts.metalness ?? 0, opts.flatShading ?? false),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
