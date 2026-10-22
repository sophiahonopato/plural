import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

// Número que conta de 0 até `value` quando aparece na tela.
export default function CountUp({ value, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const still = useReducedMotion();
  useEffect(() => {
    if (!inView) return undefined;
    if (still) { ref.current.textContent = `${value}${suffix}`; return undefined; }
    const ctrl = animate(0, value, {
      duration: 1.2, ease: [0.2, 0.9, 0.2, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`; },
    });
    return () => ctrl.stop();
  }, [inView, value, suffix, still]);
  return <span ref={ref}>0{suffix}</span>;
}
