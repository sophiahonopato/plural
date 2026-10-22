import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { worldById } from "../data/categories";
import { STATEMENTS } from "../data/quiz";
import { gameXp } from "../data/game";
import { finishGame } from "../lib/store";
import { useSession } from "../lib/session";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { Frame, Intro, Result, Stat, shuffle } from "./Shell";

const COLOR = "#FF2D87";
const DURATION = 45;
const THRESHOLD = 110;

// Carta do topo: arrastável. As de trás só aparecem empilhadas.
function SwipeCard({ item, onAnswer }) {
  const w = worldById(item.w);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const yes = useTransform(x, [20, THRESHOLD], [0, 1]);
  const no = useTransform(x, [-THRESHOLD, -20], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x" dragSnapToOrigin dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > THRESHOLD || info.velocity.x > 600) onAnswer(true);
        else if (info.offset.x < -THRESHOLD || info.velocity.x < -600) onAnswer(false);
      }}
      initial={{ scale: 0.92, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={(dir) => ({ x: dir * 700, rotate: dir * 35, opacity: 0, transition: { duration: 0.35 } })}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <div className="on-color relative flex h-full flex-col overflow-hidden rounded-[32px] border-4 border-white p-6 shadow-[0_30px_60px_-25px_rgba(60,30,120,.6)] sm:p-8" style={{ background: `linear-gradient(160deg, ${w.c}, ${w.deep})` }}>
        <motion.span style={{ opacity: yes }} className="absolute left-5 top-5 -rotate-12 rounded-xl border-4 border-[#B9FFCB] px-3 py-1 font-display text-2xl font-black text-[#B9FFCB]">VERDADE</motion.span>
        <motion.span style={{ opacity: no }} className="absolute right-5 top-5 rotate-12 rounded-xl border-4 border-[#FFC2C2] px-3 py-1 font-display text-2xl font-black text-[#FFC2C2]">MITO</motion.span>
        <div className="mt-10 flex items-center gap-3">
          <Avatar mascot={w.id} size={48} ring={false} className="border-2 border-white/70" />
          <span className="text-sm font-extrabold uppercase tracking-[.16em] text-fg/85">{w.name}</span>
        </div>
        <p className="display mt-auto text-2xl font-black leading-snug sm:text-[28px]">{item.s}</p>
        <p className="mt-4 text-sm font-bold text-fg/75">← mito · verdade →</p>
      </div>
    </motion.div>
  );
}

export default function TrueFalse() {
  const { progress } = useSession();
  const [phase, setPhase] = useState("intro");
  const [deck, setDeck] = useState(() => shuffle(STATEMENTS));
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [time, setTime] = useState(DURATION);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0, best: 0 });
  const [flash, setFlash] = useState(null);
  const [result, setResult] = useState(null);

  const ended = useRef(false);
  const finish = useCallback((s) => {
    if (ended.current) return;
    ended.current = true;
    setResult(finishGame({ id: "verdade", kind: "verdade", score: s.correct, xp: gameXp.verdade({ correct: s.correct }) }));
    setPhase("done");
  }, []);

  useEffect(() => {
    if (phase !== "play") return undefined;
    const start = performance.now();
    const t = setInterval(() => setTime(Math.max(0, DURATION - (performance.now() - start) / 1000)), 100);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => { if (phase === "play" && time <= 0) finish(stats); }, [time, phase, stats, finish]);

  const answer = useCallback((guess) => {
    if (phase !== "play") return;
    const item = deck[i];
    if (!item || ended.current) return;
    const ok = guess === item.t;
    const s = {
      correct: stats.correct + (ok ? 1 : 0), wrong: stats.wrong + (ok ? 0 : 1),
      streak: ok ? stats.streak + 1 : 0, best: Math.max(stats.best, ok ? stats.streak + 1 : 0),
    };
    setStats(s);
    setDir(guess ? 1 : -1);
    setFlash({ ok, truth: item.t, id: Date.now() });
    if (i + 1 >= deck.length) { setTimeout(() => finish(s), 300); setI(i + 1); return; }
    setI(i + 1);
  }, [phase, deck, i, stats, finish]);

  useEffect(() => {
    if (phase !== "play") return undefined;
    const onKey = (e) => { if (e.key === "ArrowRight") answer(true); if (e.key === "ArrowLeft") answer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answer]);

  function replay() {
    ended.current = false;
    setDeck(shuffle(STATEMENTS)); setI(0); setTime(DURATION); setStats({ correct: 0, wrong: 0, streak: 0, best: 0 }); setFlash(null); setResult(null); setPhase("play");
  }

  const icon = <span className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: COLOR }}><Icon name="swap" size={22} /></span>;

  if (phase === "intro") {
    return (
      <Frame title="Verdade ou Mito" color={COLOR} icon={icon}>
        <Intro
          art={<div className="relative h-36 w-28">{["estudos", "politica", "tecnologia"].map((id, k) => <motion.div key={id} className="absolute inset-0 rounded-2xl border-4 border-white shadow-lg" style={{ background: worldById(id).c }} animate={{ rotate: [-12 + k * 12, -6 + k * 12, -12 + k * 12] }} transition={{ duration: 2.2, repeat: Infinity, delay: k * 0.2 }} />)}</div>}
          rules={[`${DURATION} segundos para julgar o máximo de frases.`, "Arraste pra direita (ou →) se for verdade.", "Arraste pra esquerda (ou ←) se for mito.", "Cada acerto vale XP. Errou? Segue o jogo!"]}
          best={progress?.games.best.verdade}
          onStart={() => { ended.current = false; setPhase("play"); }}
        />
      </Frame>
    );
  }

  if (phase === "done") {
    const total = stats.correct + stats.wrong;
    const pct = total ? stats.correct / total : 0;
    const stars = stats.correct >= 15 && pct >= 0.85 ? 3 : stats.correct >= 9 ? 2 : stats.correct >= 4 ? 1 : 0;
    return (
      <Frame title="Verdade ou Mito" color={COLOR} icon={icon}>
        <Result title={stars === 3 ? "Detector de mitos!" : "Fim do tempo!"} score={stats.correct} unit="acertos" stars={stars} details={`${total} respondidas · maior sequência: ${stats.best}`} result={result} onReplay={replay} />
      </Frame>
    );
  }

  return (
    <Frame
      title="Verdade ou Mito" color={COLOR} icon={icon}
      stats={<>
        <Stat icon="timer" tone={time < 8 ? "!text-[#E02424]" : ""}>{Math.ceil(time)}s</Stat>
        <Stat icon="check">{stats.correct}</Stat>
        <Stat icon="flame" tone={stats.streak > 2 ? "chip-gold" : ""}>{stats.streak}</Stat>
      </>}
    >
      <div className="h-2.5 overflow-hidden rounded-full bg-fg/10">
        <div className="h-full rounded-full transition-[width] duration-100 ease-linear" style={{ width: `${(time / DURATION) * 100}%`, background: time < 8 ? "#FF4040" : COLOR }} />
      </div>

      <div className="relative mx-auto mt-6 h-[380px] max-w-sm sm:h-[420px]">
        {/* cartas de trás */}
        {[2, 1].map((k) => deck[i + k] && (
          <div key={i + k} className="absolute inset-0 rounded-[32px] border-4 border-white" style={{ background: worldById(deck[i + k].w).c, transform: `translateY(${k * 14}px) scale(${1 - k * 0.05})`, opacity: 0.55 }} />
        ))}
        <AnimatePresence custom={dir}>
          {deck[i] && <SwipeCard key={i} item={deck[i]} onAnswer={answer} />}
        </AnimatePresence>
        <AnimatePresence>
          {flash && (
            <motion.div
              key={flash.id} className="pointer-events-none absolute inset-x-0 -bottom-4 z-10 mx-auto w-fit rounded-full px-4 py-2 font-display text-sm font-black text-white shadow-lg"
              style={{ background: flash.ok ? "#2FCB5A" : "#FF4040" }}
              initial={{ y: 20, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              onAnimationComplete={() => setTimeout(() => setFlash((f) => (f?.id === flash.id ? null : f)), 500)}
            >
              {flash.ok ? "Acertou!" : `Ops! Era ${flash.truth ? "verdade" : "mito"}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => answer(false)} className="btn btn-lg" style={{ background: "#FF4040", color: "#fff", "--edge": "#9B1515" }}>
          <Icon name="x" strokeWidth={3} /> Mito
        </motion.button>
        <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => answer(true)} className="btn btn-lg" style={{ background: "#2FCB5A", color: "#fff", "--edge": "#14803A" }}>
          <Icon name="check" strokeWidth={3} /> Verdade
        </motion.button>
      </div>
    </Frame>
  );
}
