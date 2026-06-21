/**
 * Sky + lighting. A big inward-facing sphere with a golden-hour vertical
 * gradient + a soft sun glow (shader), procedurally varied cloud puffs, a real
 * round sun sprite, the golden-hour sun (directional, casts shadows), and the
 * ambient hemisphere + cool fill. The room floats in this sky — the walls
 * occlude it everywhere except through the two windows.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function addEnvironment(scene: THREE.Scene): void {
  const sunPosition = new THREE.Vector3(-11, 5.5, 9);

  const skyGeometry = new THREE.SphereGeometry(46, 48, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uHorizon: { value: new THREE.Color(0xffd7a6) },
      uZenith: { value: new THREE.Color(0x3f74c4) },
      uGround: { value: new THREE.Color(0xc9b89a) },
      uSunColor: { value: new THREE.Color(0xfff1cf) },
      uSunDir: { value: sunPosition.clone().normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform vec3 uHorizon;
      uniform vec3 uZenith;
      uniform vec3 uGround;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      void main() {
        float h = vDir.y;
        vec3 sky = mix(uHorizon, uZenith, smoothstep(0.0, 0.65, h));
        sky = mix(sky, uGround, smoothstep(0.0, -0.25, h));
        // soft atmospheric warmth around the sun (the crisp disc is a real
        // mesh, added below — this is just the haze that surrounds it)
        float sun = max(dot(vDir, uSunDir), 0.0);
        sky += uSunColor * pow(sun, 8.0) * 0.3;
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
  scene.background = new THREE.Color(0x9bbce8);

  // fluffy cumulus clouds, each one procedurally varied so no two look alike:
  // different lobe counts, sizes, horizontal spread, stretch, tilt and a faint
  // warm/cool near-white tint. Flattened bottoms read more cloud-like.
  // each cloud's puffs are baked into ONE merged geometry → one draw call per
  // cloud (instead of ~10). Unlit MeshBasic, so the non-uniform puff scaling
  // mangling normals doesn't matter.
  const puffTemplate = new THREE.SphereGeometry(1, 16, 12);
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const makeCloud = (scale: number) => {
    // near-white with a subtle warm or cool cast (never greenish)
    const hue = Math.random() < 0.5 ? rand(0.07, 0.12) : rand(0.55, 0.62);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue, rand(0.06, 0.16), rand(0.9, 0.97)),
    });
    const spread = rand(2.0, 3.8);
    const lobes = 5 + Math.floor(rand(0, 4));
    const puffs: THREE.BufferGeometry[] = [];
    const addPuff = (px: number, py: number, pz: number, sx: number, sy: number, sz: number) => {
      const g = puffTemplate.clone().scale(sx, sy, sz);
      g.translate(px, py, pz);
      puffs.push(g);
    };
    for (let i = 0; i < lobes; i++) {
      const t = lobes === 1 ? 0 : i / (lobes - 1) - 0.5; // −0.5..0.5 along the base
      const r = Math.max(0.35, rand(0.6, 1.0) - Math.abs(t) * 0.7); // fatter middle
      addPuff(t * spread, rand(-0.1, 0.25), rand(-0.4, 0.4), r, r * rand(0.6, 0.78), r);
    }
    // a few smaller puffs piled on top for height/fluff
    const tops = 1 + Math.floor(rand(0, 3));
    for (let i = 0; i < tops; i++) {
      const r = rand(0.4, 0.7);
      addPuff(rand(-spread * 0.4, spread * 0.4), rand(0.45, 0.9), rand(-0.3, 0.3), r, r * 0.7, r);
    }
    const cloud = new THREE.Mesh(mergeGeometries(puffs), material);
    puffs.forEach((g) => g.dispose());
    cloud.scale.set(scale * rand(0.9, 1.25), scale * rand(0.82, 1.08), scale);
    cloud.rotation.y = rand(0, Math.PI * 2);
    return cloud;
  };
  const cloudSpots: Array<[number, number, number, number]> = [
    [-22, 8, -3, 2.0], // x, y, z, scale — out the west window
    [-27, 11, 8, 2.6],
    [-19, 6, 15, 1.6],
    [-24, 9, -13, 1.8],
    [-31, 13, 2, 2.2],
    [4, 9, 23, 2.4], // out the back window
    [-9, 12, 27, 2.8],
    [13, 7, 20, 1.8],
    [19, 10, 11, 2.0],
    [1, 14, 31, 2.2],
    [-15, 15, 18, 1.6], // a couple high overhead
    [9, 16, -6, 1.8],
  ];
  for (const [x, y, z, s] of cloudSpots) {
    const cloud = makeCloud(s);
    cloud.position.set(x, y, z);
    scene.add(cloud);
  }

  // a soft, glowing sun: a radial-gradient sprite (brightest dead centre,
  // fading smoothly out) so it reads as *shining* rather than a hard ringed
  // disc. Depth-tested, so the walls hide it — it only shows through windows.
  const sunDir = sunPosition.clone().normalize();
  const sunCenter = sunDir.clone().multiplyScalar(40);

  const glow = document.createElement('canvas');
  glow.width = glow.height = 128;
  const gctx = glow.getContext('2d')!;
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(255,255,252,1)');
  grad.addColorStop(0.13, 'rgba(255,249,226,1)');
  grad.addColorStop(0.3, 'rgba(255,228,172,0.72)');
  grad.addColorStop(0.6, 'rgba(255,208,150,0.24)');
  grad.addColorStop(1.0, 'rgba(255,200,140,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  const sunTexture = new THREE.CanvasTexture(glow);

  // two layered additive sprites: a tight bright body + a wide soft halo. They
  // both peak at the centre, so it blooms (shines) without any ring.
  for (const size of [7, 18]) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    sprite.position.copy(sunCenter);
    sprite.scale.setScalar(size);
    scene.add(sprite);
  }

  // the golden-hour sun light: warm, low, streaming through the windows.
  // Shadow frustum is sized to enclose the whole room (walls + ceiling) so the
  // walls actually occlude the sunlight instead of it leaking through them.
  const sun = new THREE.DirectionalLight(0xffd9a0, 2.4);
  sun.position.copy(sunPosition);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 45;
  sun.shadow.camera.left = -7.5;
  sun.shadow.camera.right = 7.5;
  sun.shadow.camera.top = 7.5;
  sun.shadow.camera.bottom = -7.5;
  sun.shadow.bias = -0.0004;
  sun.target.position.set(0, 1, 0);
  scene.add(sun);
  scene.add(sun.target);

  // ambient fill so shadows aren't pure black
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x6b5a44, 0.75));
  const fill = new THREE.DirectionalLight(0xbcd2ff, 0.35);
  fill.position.set(7, 5, -5);
  scene.add(fill);
}
