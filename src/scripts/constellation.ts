// Hero constellation: a field of gold data points. Every few seconds a "query"
// beam leaves the star (the retrieval agent) and lights the node it found.
import * as THREE from 'three';
import { gsap } from 'gsap';

const GOLD = new THREE.Color('#D9B97A');
const GOLD_DEEP = new THREE.Color('#A8834A');
const CRIMSON = new THREE.Color('#B23A4C');

export function mountConstellation(canvas: HTMLCanvasElement): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const group = new THREE.Group();
  scene.add(group);

  // seeded random so the layout looks the same on every visit
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const N = 170;
  const pos = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const glow = new Float32Array(N);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    // flattened ellipsoid, denser toward the middle
    const r = Math.pow(rand(), 0.7);
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(2 * rand() - 1);
    const v = new THREE.Vector3(
      Math.sin(ph) * Math.cos(th) * 5.2 * r,
      Math.sin(ph) * Math.sin(th) * 3.6 * r,
      Math.cos(ph) * 2.6 * r,
    );
    pts.push(v);
    pos.set([v.x, v.y, v.z], i * 3);
    size[i] = 4 + rand() * 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('glow', new THREE.BufferAttribute(glow, 1));

  const pointMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uPR: { value: renderer.getPixelRatio() }, uGold: { value: GOLD }, uDeep: { value: GOLD_DEEP } },
    vertexShader: `
      attribute float size; attribute float glow;
      uniform float uPR; varying float vGlow; varying float vDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vGlow = glow; vDepth = clamp((-mv.z - 10.0) / 8.0, 0.0, 1.0);
        gl_PointSize = (size + glow * 14.0) * uPR * (12.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uGold; uniform vec3 uDeep; varying float vGlow; varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        float a = pow(core, 1.8) * mix(1.0, 0.45, vDepth) + vGlow * pow(core, 1.2);
        vec3 c = mix(uDeep, uGold, core + vGlow);
        gl_FragColor = vec4(c, a);
      }`,
  });
  group.add(new THREE.Points(geo, pointMat));

  // connect each node to its nearest neighbours
  const segs: number[] = [];
  const neighbours: number[][] = pts.map(() => []);
  for (let i = 0; i < N; i++) {
    const near = pts
      .map((p, j) => ({ j, d: p.distanceTo(pts[i]) }))
      .filter((o) => o.j !== i && o.d < 1.9)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    for (const { j } of near) {
      if (j < i && neighbours[j].includes(i)) continue;
      neighbours[i].push(j);
      segs.push(...pts[i].toArray(), ...pts[j].toArray());
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  // the "agent": a crimson star on the left edge of the field
  const origin = new THREE.Vector3(-4.6, 0.5, 1.0);
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(origin.toArray(), 3));
  starGeo.setAttribute('size', new THREE.Float32BufferAttribute([18], 1));
  starGeo.setAttribute('glow', new THREE.Float32BufferAttribute([0.6], 1));
  const starMat = pointMat.clone();
  starMat.uniforms.uGold = { value: CRIMSON.clone().lerp(GOLD, 0.25) };
  starMat.uniforms.uDeep = { value: CRIMSON };
  group.add(new THREE.Points(starGeo, starMat));

  // query beam from the star to a found node
  const beamGeo = new THREE.BufferGeometry();
  const beamPos = new Float32Array(6);
  beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPos, 3));
  const beamMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.Line(beamGeo, beamMat));

  const glowAttr = geo.getAttribute('glow') as THREE.BufferAttribute;
  const query = () => {
    const i = Math.floor(rand() * N);
    const hit = pts[i];
    const tip = { t: 0 };
    const tl = gsap.timeline();
    tl.to(tip, {
      t: 1, duration: 0.9, ease: 'power2.inOut',
      onStart: () => { beamMat.opacity = 0.75; },
      onUpdate: () => {
        const p = origin.clone().lerp(hit, tip.t);
        beamPos.set([...origin.toArray(), ...p.toArray()]);
        beamGeo.attributes.position.needsUpdate = true;
      },
    })
      .to({}, {
        duration: 0.5, ease: 'power2.out',
        onUpdate() { glow[i] = this.progress(); neighbours[i].forEach((n) => (glow[n] = this.progress() * 0.35)); glowAttr.needsUpdate = true; },
      })
      .to(beamMat, { opacity: 0, duration: 0.8 }, '+=0.6')
      .to({}, {
        duration: 1.0, ease: 'power2.in',
        onUpdate() { const k = 1 - this.progress(); glow[i] = k; neighbours[i].forEach((n) => (glow[n] = k * 0.35)); glowAttr.needsUpdate = true; },
      }, '<');
  };
  const queryTimer = window.setInterval(query, 3200);
  window.setTimeout(query, 900);

  // layout: field sits right of the headline on wide screens, centred behind it on phones
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 900;
    group.position.x = wide ? 5.2 : 0;
    group.scale.setScalar(wide ? 0.9 : 0.75);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const mouse = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);

  const t0 = performance.now();
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = (performance.now() - t0) / 1000;
    group.rotation.y += ((mouse.x * 0.35 + Math.sin(t * 0.08) * 0.25) - group.rotation.y) * 0.03;
    group.rotation.x += ((mouse.y * 0.2) - group.rotation.x) * 0.03;
    renderer.render(scene, camera);
  };
  tick();
  gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' });

  return () => {
    cancelAnimationFrame(raf);
    clearInterval(queryTimer);
    ro.disconnect(); io.disconnect();
    window.removeEventListener('pointermove', onMove);
    geo.dispose(); lineGeo.dispose(); starGeo.dispose(); beamGeo.dispose();
    pointMat.dispose(); starMat.dispose(); lineMat.dispose(); beamMat.dispose();
    renderer.dispose();
  };
}
