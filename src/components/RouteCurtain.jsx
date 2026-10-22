import { motion, useReducedMotion } from "framer-motion";
import { WORLDS } from "../data/categories";

// Troca de página: seis faixas nas cores dos mundos recolhem pra cima,
// revelando a página nova. Remonta a cada rota (key = pathname no App).
export default function RouteCurtain() {
  const still = useReducedMotion();
  if (still) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[150] flex">
      {WORLDS.map((w, i) => (
        <motion.span
          key={w.id}
          className="h-full flex-1"
          style={{ background: w.c, originY: 0 }}
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.55, delay: 0.05 + i * 0.045, ease: [0.76, 0, 0.24, 1] }}
        />
      ))}
    </div>
  );
}
