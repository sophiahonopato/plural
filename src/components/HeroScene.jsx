import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { WORLDS } from "../data/categories";

// Peças 3D "de brinquedo" flutuando nas cores dos mundos. Reagem ao ponteiro
// (fogem dele) e ao scroll. Posições em coordenadas normalizadas da tela
// (-1..1), pra ficarem nas bordas em qualquer proporção.
//          nx     ny     z   escala  forma       cor
const LAYOUT = [
  [-0.86, 0.52, 0.5, 1.15, "torus", 0],
  [-0.6, -0.12, -3, 0.8, "sphere", 4],
  [-0.9, -0.62, 1, 1.0, "box", 2],
  [-0.4, 0.84, -4, 0.7, "ico", 5],
  [0.86, 0.58, 0, 1.2, "capsule", 3],
  [0.62, 0.02, -3, 0.75, "torus", 1],
  [0.9, -0.55, 1, 1.0, "ico", 0],
  [0.42, 0.86, -5, 0.8, "sphere", 2],
  [-0.24, -0.9, -2, 0.7, "cone", 3],
  [0.26, -0.92, -1, 0.8, "torus", 5],
  [0.02, 0.98, -6, 0.6, "box", 4],
  [-1.08, 0.06, -5, 0.9, "capsule", 1],
  [1.08, -0.06, -6, 0.9, "sphere", 5],
  [0.7, -0.95, -4, 0.6, "box", 3],
  [-0.66, 0.98, -2, 0.5, "sphere", 0],
  [-0.52, -0.52, -7, 0.9, "torus", 1],
  // moedas de XP
  [-0.74, 0.12, 2, 0.9, "coin", 6],
  [0.76, 0.3, 2.5, 0.8, "coin", 6],
  [0.12, -0.72, 1.5, 0.7, "coin", 6],
];

export default function HeroScene({ className = "" }) {
  const mount = useRef(null);

  useEffect(() => {
    const el = mount.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      return undefined; // sem WebGL: o hero continua funcionando só com o fundo
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 14;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 6, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x8b3dff, 60, 40);
    rim.position.set(-8, -4, 4);
    scene.add(rim);

    const geos = {
      torus: new THREE.TorusGeometry(0.72, 0.3, 28, 72),
      sphere: new THREE.SphereGeometry(0.8, 48, 32),
      box: new RoundedBoxGeometry(1.2, 1.2, 1.2, 6, 0.28),
      ico: new THREE.IcosahedronGeometry(0.9, 0),
      capsule: new THREE.CapsuleGeometry(0.42, 1.0, 12, 28),
      cone: new THREE.ConeGeometry(0.75, 1.3, 40),
      coin: new THREE.CylinderGeometry(0.75, 0.75, 0.2, 56).rotateX(Math.PI / 2),
    };
    const mats = WORLDS.map((w) => new THREE.MeshPhysicalMaterial({
      color: w.c, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.15,
    }));
    mats.push(new THREE.MeshPhysicalMaterial({ color: "#FFC21A", roughness: 0.2, metalness: 1, clearcoat: 1 }));

    const group = new THREE.Group();
    scene.add(group);
    const items = LAYOUT.map(([nx, ny, z, scale, shape, color], i) => {
      const mesh = new THREE.Mesh(geos[shape], mats[color]);
      mesh.scale.setScalar(scale);
      mesh.rotation.set(i * 1.3, i * 0.7, i * 0.4);
      group.add(mesh);
      return {
        mesh, nx, ny, z, scale, coin: shape === "coin", base: new THREE.Vector3(), push: new THREE.Vector2(), vel: new THREE.Vector2(),
        phase: i * 1.7, speed: 0.5 + (i % 5) * 0.12, spin: 0.12 + (i % 4) * 0.07,
      };
    });

    // poeira de estrelas
    const starCount = 260;
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 2] = -4 - Math.random() * 16;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x8b3dff, size: 0.06, transparent: true, opacity: 0.35, depthWrite: false });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    function resize() {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      // em tela estreita as peças encolhem e vão mais pras bordas, pra não cobrir o texto
      const narrow = THREE.MathUtils.clamp(camera.aspect / 1.5, 0.45, 1);
      for (const it of items) {
        const halfH = tan * (camera.position.z - it.z);
        it.base.set((it.nx * halfH * camera.aspect) / Math.sqrt(narrow), it.ny * halfH, it.z);
        it.mesh.scale.setScalar(it.scale * narrow);
      }
    }
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const pointer = new THREE.Vector2(0, 0);
    const world = new THREE.Vector3();
    let hasPointer = false;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      hasPointer = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let visible = true;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(el);

    function frame() {
      raf = 0;
      if (!visible) return;
      const t = still ? 0 : (performance.now() - t0) / 1000;
      const scroll = window.scrollY / Math.max(1, el.clientHeight);
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

      for (const it of items) {
        // ponteiro projetado na profundidade da peça → empurrão com mola
        if (hasPointer && !still) {
          const halfH = tan * (camera.position.z - it.z);
          world.set(pointer.x * halfH * camera.aspect, pointer.y * halfH, it.z);
          const dx = it.base.x + it.push.x - world.x;
          const dy = it.base.y + it.push.y - world.y;
          const d = Math.hypot(dx, dy);
          const R = 3.2;
          if (d < R && d > 0.001) {
            const f = (1 - d / R) * 0.05;
            it.vel.x += (dx / d) * f;
            it.vel.y += (dy / d) * f;
          }
        }
        it.vel.x += -it.push.x * 0.012;
        it.vel.y += -it.push.y * 0.012;
        it.vel.multiplyScalar(0.92);
        it.push.add(it.vel);

        const depth = (it.z + 8) / 9; // 0 (fundo) .. 1 (frente)
        it.mesh.position.set(
          it.base.x + it.push.x + pointer.x * depth * 0.5,
          it.base.y + it.push.y + Math.sin(t * it.speed + it.phase) * 0.35 + scroll * (2 + depth * 5) + pointer.y * depth * 0.3,
          it.z
        );
        it.mesh.rotation.x += it.spin * 0.012 + it.vel.y * 0.2;
        it.mesh.rotation.y += (it.coin ? 0.035 : it.spin * 0.016) + it.vel.x * 0.2;
      }
      stars.rotation.z = t * 0.01;
      stars.position.y = scroll * 1.5;
      group.rotation.y += (pointer.x * 0.08 - group.rotation.y) * 0.05;
      group.rotation.x += (-pointer.y * 0.05 - group.rotation.x) * 0.05;

      renderer.render(scene, camera);
      if (!still) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      Object.values(geos).forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      starGeo.dispose();
      starMat.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} aria-hidden="true" className={`pointer-events-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full ${className}`} />;
}
