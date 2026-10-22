import { useRef } from "react";
import { gsap, useGSAP, reducedMotion } from "../lib/gsap";

// Inclina o conteúdo em 3D seguindo o ponteiro e move o brilho (.tilt-shine).
export default function Tilt({ children, className = "", max = 12, style, ...rest }) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    if (reducedMotion() || !window.matchMedia("(hover: hover)").matches) return;
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 2 * max);
      rx((0.5 - py) * 2 * max);
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      el.style.setProperty("--shine", "1");
    };
    const leave = () => { rx(0); ry(0); el.style.setProperty("--shine", "0"); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, { scope: ref });

  return (
    <div ref={ref} className={`tilt relative ${className}`} style={style} {...rest}>
      {children}
      <span className="tilt-shine" />
    </div>
  );
}
