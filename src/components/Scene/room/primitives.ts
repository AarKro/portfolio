/** Tiny mesh factories shared by the room/* builders. All cast + receive shadows. */
import * as THREE from 'three';

export function box(
  w: number,
  h: number,
  d: number,
  color: number,
  opts: { roughness?: number; metalness?: number } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0,
    }),
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
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, opts.segments ?? 18),
    new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.8,
      metalness: opts.metalness ?? 0,
    }),
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
    new THREE.SphereGeometry(r, 16, 12),
    new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.6,
      metalness: opts.metalness ?? 0,
      flatShading: opts.flatShading ?? false,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
