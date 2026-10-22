import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, useGSAP, reducedMotion } from "../lib/gsap";
import { onGameEvent } from "../lib/store";
import { WORLDS } from "../data/categories";
import Icon from "./Icon";
import Avatar from "./Avatar";

const COLORS = [...WORLDS.map((w) => w.c), "#FFD23F", "#1A1030"];

// Explosão de confete a partir de um ponto da tela.
export function confetti(x = window.innerWidth / 2, y = window.innerHeight / 3, count = 70) {
  if (reducedMotion()) return;
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:120;overflow:hidden";
  document.body.appendChild(layer);
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("i");
    const size = 6 + Math.random() * 8;
    bit.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * (Math.random() > 0.5 ? 1 : 0.45)}px;background:${COLORS[i % COLORS.length]};border-radius:${Math.random() > 0.6 ? "50%" : "2px"}`;
    layer.appendChild(bit);
    gsap.to(bit, {
      duration: 1.6 + Math.random() * 1.2,
      physics2D: { velocity: 350 + Math.random() * 650, angle: -90 + (Math.random() - 0.5) * 150, gravity: 1300 },
      rotation: (Math.random() - 0.5) * 1080,
      opacity: 0,
      ease: "none",
    });
  }
  gsap.delayedCall(3, () => layer.remove());
}

const Toast = forwardRef(function Toast({ ev, onDone }, ref) {
  useEffect(() => {
    const t = setTimeout(onDone, ev.type === "badge" ? 4000 : 2700);
    return () => clearTimeout(t);
  }, [ev, onDone]);

  let icon = <Icon name="bolt" fill size={18} />;
  let tint = "#E8A400";
  let title = ev.text;
  let sub = null;
  if (ev.type === "xp") { title = `+${ev.amount} XP`; sub = ev.label; }
  if (ev.type === "badge") {
    tint = ev.badge.c; title = ev.badge.name; sub = "Conquista desbloqueada";
    icon = ev.badge.world ? <Avatar mascot={ev.badge.world} size={36} ring={false} /> : <Icon name={ev.badge.icon} fill size={18} />;
  }
  if (ev.type === "note") { tint = "#8B3DFF"; icon = <Icon name="check" size={18} />; }

  return (
    <motion.div
      ref={ref} layout role="status"
      initial={{ x: 80, opacity: 0, scale: 0.7, rotate: 6 }}
      animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
      exit={{ x: 60, opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-fg/10 bg-surface/95 py-2.5 pl-2.5 pr-5 shadow-[0_20px_40px_-18px_rgba(60,30,120,.45)] backdrop-blur"
    >
      <motion.span
        initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.08 }}
        className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl" style={{ background: `${tint}22`, color: tint }}
      >
        {icon}
      </motion.span>
      <span className="leading-tight">
        <b className="block font-display text-sm" style={{ color: ev.type === "note" ? "rgb(var(--fg))" : tint }}>{title}</b>
        {sub && <span className="text-xs text-mist">{sub}</span>}
      </span>
    </motion.div>
  );
});

function LevelUp({ ev, onDone }) {
  const ref = useRef(null);
  useGSAP(() => {
    confetti(window.innerWidth / 2, window.innerHeight / 2, 120);
    gsap.timeline({ onComplete: onDone })
      .from(ref.current, { opacity: 0, duration: 0.25 })
      .from(".lv-ring", { scale: 0, rotation: -180, duration: 0.8, ease: "back.out(1.6)" }, "<")
      .from(".lv-num", { scale: 3, opacity: 0, duration: 0.5, ease: "power4.out" }, "-=0.4")
      .from(".lv-text > *", { y: 24, opacity: 0, stagger: 0.08, duration: 0.4 }, "-=0.2")
      .to(ref.current, { opacity: 0, duration: 0.35 }, "+=1.7");
  }, { scope: ref });

  return (
    <div ref={ref} onClick={onDone} className="fixed inset-0 z-[110] grid place-items-center on-color bg-ink-950/85 backdrop-blur-sm">
      <div className="text-center">
        <div className="lv-ring relative mx-auto grid h-44 w-44 place-items-center rounded-full bg-gradient-to-b from-[#FFE27A] to-[#FFB800] shadow-[0_0_80px_rgba(255,200,40,.6)]">
          <span className="absolute inset-2 rounded-full border-4 border-dashed border-[#a86f00]/50 spin-slow" />
          <span className="lv-num display text-7xl font-black text-[#3A2500]">{ev.level}</span>
        </div>
        <div className="lv-text mt-7">
          <p className="kicker justify-center">Subiu de nível</p>
          <p className="display mt-2 text-4xl font-black">{ev.title}</p>
        </div>
      </div>
    </div>
  );
}

// Camada global: mostra XP ganho, conquistas e a tela de "subiu de nível".
export default function GameFX() {
  const [toasts, setToasts] = useState([]);
  const [levelUp, setLevelUp] = useState(null);
  const seq = useRef(0);
  const dismiss = useCallback((key) => setToasts((list) => list.filter((x) => x.key !== key)), []);

  useEffect(() => onGameEvent((ev) => {
    if (ev.type === "level") return setLevelUp(ev);
    setToasts((list) => [...list.slice(-4), { ...ev, key: ++seq.current }]);
  }), []);

  return (
    <>
      <div className="pointer-events-none fixed bottom-24 right-4 z-[100] flex flex-col items-end gap-2 md:bottom-6 md:right-6">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => <Toast key={t.key} ev={t} onDone={() => dismiss(t.key)} />)}
        </AnimatePresence>
      </div>
      {levelUp && <LevelUp ev={levelUp} onDone={() => setLevelUp(null)} />}
    </>
  );
}
