import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// Puxa o filho na direção do ponteiro, como um ímã, e volta com mola.
export default function Magnetic({ children, strength = 0.35, className = "" }) {
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 14 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 14 });
  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      whileTap={{ scale: 0.94 }}
    >
      {children}
    </motion.span>
  );
}
