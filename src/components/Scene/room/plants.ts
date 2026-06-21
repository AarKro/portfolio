/**
 * Potted plants. `makePlant` builds one at origin (`'tall'` = upright snake-plant
 * blades, `'bushy'` = a randomized leafy mound); `addPlants` scatters the floor
 * cluster around the room.
 */
import * as THREE from 'three';
import { cylinder } from './primitives';
import { COL } from './palette';

// Shared across every bushy leaf in the scene: one unit icosahedron (scaled
// per-leaf) and three green materials, instead of a fresh geometry + material
// for each of the ~50 leaves.
const LEAF_GEOMETRY = new THREE.IcosahedronGeometry(1, 0);
const LEAF_MATERIALS = [COL.leaf, COL.leafDark, COL.leafLight].map(
  (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true }),
);

export function makePlant(
  kind: 'tall' | 'bushy',
  scale = 1,
  potColor: number = COL.potTerra,
): THREE.Group {
  const plant = new THREE.Group();

  const potTop = 0.16 * scale;
  const pot = cylinder(0.15 * scale, 0.11 * scale, 0.3 * scale, potColor, { roughness: 0.9 });
  pot.position.y = 0.15 * scale;
  plant.add(pot);
  const soil = cylinder(0.14 * scale, 0.14 * scale, 0.04 * scale, 0x2e2419, { roughness: 1 });
  soil.position.y = potTop + 0.13 * scale;
  plant.add(soil);
  const soilTop = potTop + 0.14 * scale;

  if (kind === 'tall') {
    const blades = 9;
    for (let i = 0; i < blades; i++) {
      const len = (0.7 + Math.random() * 0.5) * scale;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.05 * scale, len, 0.012 * scale),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? COL.leaf : COL.leafDark,
          roughness: 0.7,
        }),
      );
      blade.castShadow = true;
      const angle = (i / blades) * Math.PI * 2;
      const tilt = 0.18 + Math.random() * 0.22;
      blade.position.set(
        Math.cos(angle) * 0.06 * scale,
        soilTop + len / 2,
        Math.sin(angle) * 0.06 * scale,
      );
      blade.rotation.z = Math.cos(angle) * tilt;
      blade.rotation.x = -Math.sin(angle) * tilt;
      plant.add(blade);
    }
  } else {
    // a bulky leafy mound — randomized lobe count, placement, size and green
    // shade, so every bushy plant is a bit different (shared geometry/materials)
    const clumps = 6 + Math.floor(Math.random() * 4); // 6–9 lobes
    const spread = (0.16 + Math.random() * 0.09) * scale;
    for (let i = 0; i < clumps; i++) {
      const r = (0.18 + Math.random() * 0.16) * scale;
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * spread;
      const leaf = new THREE.Mesh(
        LEAF_GEOMETRY,
        LEAF_MATERIALS[Math.floor(Math.random() * LEAF_MATERIALS.length)],
      );
      leaf.castShadow = true;
      leaf.position.set(
        Math.cos(angle) * rad,
        soilTop + Math.random() * 0.34 * scale, // sit lower, nestled on the pot (no hover)
        Math.sin(angle) * rad,
      );
      leaf.scale.set(r, r * (0.8 + Math.random() * 0.25), r);
      leaf.rotation.y = Math.random() * Math.PI;
      plant.add(leaf);
    }
  }
  return plant;
}

// mostly bulky leafy ones (the favourite), scattered around. [plant, x, z, rotY]
export function addPlants(scene: THREE.Scene): void {
  const plants: Array<[THREE.Group, number, number, number]> = [
    // front-right corner cluster (orientation = looking at the TV): the big one
    // hugs the corner, the other two trail toward the window
    [makePlant('bushy', 1.8, COL.potStone), 2.6, -2.8, 1.4], // corner — big and bulky
    [makePlant('bushy', 1.15, COL.potTerra), 2.08, -2.76, 0.6],
    [makePlant('bushy', 0.95, COL.potDark), 2.8, -2.16, 2.2],
    // back-left corner — a single big plant in the corner
    [makePlant('bushy', 1.8, COL.potTerra), -2.64, 2.56, 0.2],
    // back-right corner + desk gap
    [makePlant('bushy', 1.1, COL.potDark), 2.64, 2.56, 1.7],
    [makePlant('bushy', 0.95, COL.potTerra), 2.72, 1.6, 1.3],
  ];
  for (const [plant, x, z, rotationY] of plants) {
    plant.position.set(x, 0, z);
    plant.rotation.y = rotationY;
    scene.add(plant);
  }
}
