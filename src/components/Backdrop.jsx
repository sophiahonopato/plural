import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { WORLDS } from "../data/categories";

// Fundo branco "vivo": manchas nas cores dos mundos que flutuam devagar,
// mais uma que segue o ponteiro. O granulado do body::after fica por cima
// e transforma tudo num gradiente granulado.
const BLOBS = [
  { c: WORLDS[0].c, size: 46, x: "-8%", y: "-12%", path: { x: [0, 80, -40, 0], y: [0, 60, 120, 0] }, t: 26 },
  { c: WORLDS[4].c, size: 42, x: "62%", y: "-8%", path: { x: [0, -90, 30, 0], y: [0, 80, 20, 0] }, t: 30 },
  { c: WORLDS[5].c, size: 50, x: "30%", y: "45%", path: { x: [0, 120, -60, 0], y: [0, -70, 40, 0] }, t: 34 },
  { c: WORLDS[2].c, size: 34, x: "-10%", y: "70%", path: { x: [0, 70, 140, 0], y: [0, -50, 30, 0] }, t: 28 },
  { c: WORLDS[3].c, size: 36, x: "75%", y: "68%", path: { x: [0, -60, -120, 0], y: [0, -90, 10, 0] }, t: 32 },
];

export default function Backdrop() {
  const still = useReducedMotion();
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const x = useSpring(mx, { stiffness: 40, damping: 18, mass: 1.2 });
  const y = useSpring(my, { stiffness: 40, damping: 18, mass: 1.2 });

  useEffect(() => {
    const move = (e) => { mx.set(e.clientX - 260); my.set(e.clientY - 260); };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [mx, my]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BLOBS.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{ left: b.x, top: b.y, width: `${b.size * 1.6}vw`, height: `${b.size * 1.6}vw`, background: `radial-gradient(circle, ${b.c} 0%, transparent 62%)`, opacity: 0.28 }}
          animate={still ? undefined : b.path}
          transition={{ duration: b.t, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <motion.span
        className="absolute h-[520px] w-[520px] rounded-full will-change-transform"
        style={{ x, y, background: "radial-gradient(circle, #8B3DFF 0%, #FF2D8799 35%, transparent 65%)", opacity: 0.25 }}
      />
    </div>
  );
}
