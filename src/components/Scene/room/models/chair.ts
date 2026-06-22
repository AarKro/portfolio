/** A simple office chair (seat, back, post, 5-star castor base), built at origin. */
import * as THREE from 'three';
import { box, cylinder } from '../primitives';
import { COL } from '../palette';

export function makeChair(): THREE.Group {
  const chair = new THREE.Group();
  const seat = box(0.5, 0.08, 0.48, COL.chairFabric, { roughness: 0.7 });
  seat.position.y = 0.5;
  chair.add(seat);
  const backrest = box(0.48, 0.5, 0.07, COL.chairFabric, { roughness: 0.7 });
  backrest.position.set(0, 0.78, -0.22);
  chair.add(backrest);

  const post = cylinder(0.04, 0.04, 0.45, COL.chairMetal, {
    roughness: 0.4,
    metalness: 0.7,
    segments: 12,
  });
  post.position.y = 0.27;
  chair.add(post);

  // 5-star base with castor stubs
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const leg = box(0.34, 0.04, 0.06, COL.chairMetal, { roughness: 0.4, metalness: 0.7 });
    leg.position.set(Math.cos(angle) * 0.16, 0.05, Math.sin(angle) * 0.16);
    leg.rotation.y = -angle;
    chair.add(leg);
    const castor = cylinder(0.035, 0.035, 0.05, COL.consoleLeg, { segments: 10 });
    castor.rotation.x = Math.PI / 2;
    castor.position.set(Math.cos(angle) * 0.31, 0.035, Math.sin(angle) * 0.31);
    chair.add(castor);
  }
  return chair;
}
