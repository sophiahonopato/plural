import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WORLDS } from "../data/categories";
import { gameXp } from "../data/game";
import { finishGame } from "../lib/store";
import { useSession } from "../lib/session";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { FloatText, Frame, Intro, Result, Stat } from "./Shell";

const COLOR = "#FF8A1F";
const DURATION = 30;
const HOLES = 9;
const POINTS = { mascot: 10, coin: 25, bomb: -15 };

function Item({ item }) {
  if (item.type === "coin") {
    return (
      <motion.span className="grid h-16 w-16 place-items-center rounded-full border-4 border-[#C98A00] bg-gradient-to-b from-[#FFE27A] to-[#FFB800] text-[#7A4D00] shadow-[0_0_24px_#FFC21A] sm:h-20 sm:w-20" animate={{ rotateY: [0, 360] }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
        <span className="display text-lg font-black">XP</span>
      </motion.span>
    );
  }
  if (item.type === "bomb") {
    return (
      <motion.span className="grid h-16 w-16 place-items-center rounded-full bg-[#1A1030] text-[#FF4040] shadow-[0_0_20px_#FF404099] sm:h-20 sm:w-20" animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 0.3, repeat: Infinity }}>
        <Icon name="bomb" size={32} />
      </motion.span>
    );
  }
  return <Avatar mascot={item.world} size={76} className="!h-16 !w-16 sm:!h-20 sm:!w-20" />;
}

export default function Whack() {
  const { progress } = useSession();
  const [phase, setPhase] = useState("intro");
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(DURATION);
  const [floats, setFloats] = useState([]);
  const [hits, setHits] = useState({ mascot: 0, coin: 0, bomb: 0 });
  const [shake, setShake] = useState(0);
  const [result, setResult] = useState(null);
  const live = useRef({ items: [], score: 0, start: 0 });
  const seq = useRef(0);

  // relógio + gerador de alvos (fica mais rápido conforme o tempo passa)
  useEffect(() => {
    if (phase !== "play") return undefined;
    live.current = { items: [], score: 0, start: performance.now() };
    let spawnTimer;
    const timers = new Set();
    const clock = setInterval(() => {
      const left = Math.max(0, DURATION - (performance.now() - live.current.start) / 1000);
      setTime(left);
      if (left <= 0) end();
    }, 100);

    function spawn() {
      const elapsed = (performance.now() - live.current.start) / 1000;
      const speed = 1 - Math.min(0.45, elapsed / DURATION * 0.45);
      const busy = new Set(live.current.items.map((it) => it.hole));
      const free = [...Array(HOLES).keys()].filter((h) => !busy.has(h));
      if (free.length) {
        const r = Math.random();
        const type = r < 0.14 ? "coin" : r < 0.36 ? "bomb" : "mascot";
        const item = { id: ++seq.current, hole: free[Math.floor(Math.random() * free.length)], type, world: WORLDS[Math.floor(Math.random() * WORLDS.length)].id };
        live.current.items = [...live.current.items, item];
        setItems(live.current.items);
        const life = (type === "coin" ? 750 : type === "bomb" ? 1400 : 1150) * speed;
        const t = setTimeout(() => { remove(item.id); timers.delete(t); }, life);
        timers.add(t);
      }
      spawnTimer = setTimeout(spawn, (380 + Math.random() * 380) * speed);
    }
    spawn();

    function end() {
      clearInterval(clock); clearTimeout(spawnTimer); timers.forEach(clearTimeout);
      live.current.items = []; setItems([]);
      const final = Math.max(0, live.current.score);
      setResult({ ...finishGame({ id: "pega-xp", kind: "pega-xp", score: final, xp: gameXp["pega-xp"]({ score: final }) }), score: final });
      setPhase("done");
    }
    return () => { clearInterval(clock); clearTimeout(spawnTimer); timers.forEach(clearTimeout); };
  }, [phase]);

  function remove(id) {
    live.current.items = live.current.items.filter((it) => it.id !== id);
    setItems(live.current.items);
  }

  function hit(item, e) {
    e.preventDefault();
    if (!live.current.items.some((it) => it.id === item.id)) return;
    remove(item.id);
    const pts = POINTS[item.type];
    live.current.score += pts;
    setScore(live.current.score);
    setHits((h) => ({ ...h, [item.type]: h[item.type] + 1 }));
    if (item.type === "bomb") setShake((n) => n + 1);
    const board = e.currentTarget.closest(".board").getBoundingClientRect();
    const id = ++seq.current;
    setFloats((f) => [...f, { id, x: e.clientX - board.left - 20, y: e.clientY - board.top - 30, text: pts > 0 ? `+${pts}` : pts, color: pts > 0 ? (item.type === "coin" ? "#E8A400" : "#14803A") : "#E02424" }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 800);
  }

  function replay() {
    setItems([]); setScore(0); setTime(DURATION); setHits({ mascot: 0, coin: 0, bomb: 0 }); setResult(null); setPhase("play");
  }

  const icon = <span className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: COLOR }}><Icon name="bolt" fill size={22} /></span>;

  if (phase === "intro") {
    return (
      <Frame title="Pega-XP" color={COLOR} icon={icon}>
        <Intro
          art={<div className="flex items-end gap-3"><Avatar mascot="esportes" size={80} className="floaty" /><motion.span className="grid h-16 w-16 place-items-center rounded-full border-4 border-[#C98A00] bg-gradient-to-b from-[#FFE27A] to-[#FFB800] font-display font-black text-[#7A4D00]" animate={{ rotateY: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>XP</motion.span><span className="grid h-14 w-14 place-items-center rounded-full bg-[#1A1030] text-[#FF4040]"><Icon name="bomb" size={28} /></span></div>}
          rules={[`Você tem ${DURATION} segundos.`, "Mascote: +10. Moeda de XP: +25, mas some rápido.", "Bomba: -15. Não toque!", "Fica mais rápido no final."]}
          best={progress?.games.best["pega-xp"]}
          onStart={() => setPhase("play")}
        />
      </Frame>
    );
  }

  if (phase === "done") {
    const stars = result.score >= 300 ? 3 : result.score >= 180 ? 2 : result.score >= 80 ? 1 : 0;
    return (
      <Frame title="Pega-XP" color={COLOR} icon={icon}>
        <Result title={stars === 3 ? "Reflexo de campeão!" : "Tempo esgotado!"} score={result.score} unit="pontos" stars={stars} details={`${hits.mascot} mascotes · ${hits.coin} moedas · ${hits.bomb} bombas`} result={result} onReplay={replay} />
      </Frame>
    );
  }

  return (
    <Frame
      title="Pega-XP" color={COLOR} icon={icon}
      stats={<>
        <Stat icon="timer" tone={time < 6 ? "!text-[#E02424]" : ""}>{Math.ceil(time)}s</Stat>
        <Stat icon="star">{score}</Stat>
      </>}
    >
      <div className="h-2.5 overflow-hidden rounded-full bg-fg/10">
        <div className="h-full rounded-full transition-[width] duration-100 ease-linear" style={{ width: `${(time / DURATION) * 100}%`, background: time < 6 ? "#FF4040" : COLOR }} />
      </div>
      <motion.div
        key={shake} animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : undefined} transition={{ duration: 0.35 }}
        className="board relative mx-auto mt-5 grid max-w-[520px] touch-none select-none grid-cols-3 gap-2 rounded-[32px] bg-gradient-to-b from-[#FFE9D2] to-[#FFD3A6] p-4 sm:gap-4 sm:p-6"
      >
        <FloatText items={floats} />
        {[...Array(HOLES).keys()].map((h) => {
          const item = items.find((it) => it.hole === h);
          return (
            <div key={h} className="relative aspect-square">
              {/* buraco */}
              <span className="absolute inset-x-[6%] bottom-[10%] h-[30%] rounded-[50%] bg-[#7A3E00]/50 shadow-[inset_0_10px_14px_rgba(0,0,0,.4)]" />
              {/* janela que corta o alvo na metade do buraco: parece que ele sai lá de dentro */}
              <div className="absolute inset-x-0 bottom-[25%] top-0 overflow-hidden">
                <AnimatePresence>
                  {item && (
                    <motion.button
                      key={item.id} type="button" aria-label={item.type === "bomb" ? "Bomba" : item.type === "coin" ? "Moeda de XP" : "Mascote"}
                      onPointerDown={(e) => hit(item, e)}
                      className="absolute inset-x-0 bottom-0 mx-auto grid w-fit cursor-pointer place-items-center"
                      initial={{ y: "110%" }} animate={{ y: "8%" }} exit={{ y: "110%", transition: { duration: 0.15 } }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      <Item item={item} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              {/* borda da frente do buraco, por cima do alvo */}
              <span className="pointer-events-none absolute inset-x-[6%] bottom-[10%] h-[15%] rounded-b-[50%] border-b-[6px] border-[#C77A2E]/60" />
            </div>
          );
        })}
      </motion.div>
    </Frame>
  );
}
