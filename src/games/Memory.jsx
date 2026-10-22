import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { WORLDS, avatarOf } from "../data/categories";
import { gameXp } from "../data/game";
import { finishGame } from "../lib/store";
import { useSession } from "../lib/session";
import Icon from "../components/Icon";
import { Frame, Intro, Result, Stat, shuffle } from "./Shell";

const COLOR = "#2D9CFF";
const deal = () => shuffle([...WORLDS, ...WORLDS]).map((w, i) => ({ key: i, world: w.id, c: w.c }));

function Card({ card, up, matched, onFlip, index }) {
  return (
    <motion.button
      type="button" onClick={onFlip} aria-label={up ? `Carta ${card.world}` : "Carta virada"}
      className="relative aspect-[3/4] w-full [perspective:900px]"
      initial={{ y: 40, opacity: 0, rotate: -6 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ delay: index * 0.035, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={!up ? { y: -4 } : undefined} whileTap={!up ? { scale: 0.94 } : undefined}
    >
      <motion.span
        className="absolute inset-0 block [transform-style:preserve-3d]"
        animate={{ rotateY: up ? 180 : 0, scale: matched ? [1, 1.12, 1] : 1 }}
        transition={{ rotateY: { type: "spring", stiffness: 260, damping: 22 }, scale: { duration: 0.4 } }}
      >
        {/* verso */}
        <span className="absolute inset-0 grid place-items-center rounded-2xl border-[3px] border-white bg-gradient-to-br from-[#A66BFF] to-[#5B16B8] shadow-[0_10px_20px_-10px_rgba(60,30,120,.6)] [backface-visibility:hidden]">
          <img src="/logo/logoplural.png" alt="" className="w-1/3 opacity-90 brightness-0 invert" />
        </span>
        {/* frente */}
        <span
          className="absolute inset-0 grid place-items-center rounded-2xl border-[3px] p-1.5 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ background: card.c, borderColor: matched ? "#FFC21A" : "#fff", boxShadow: matched ? "0 0 0 4px #FFC21A66, 0 10px 24px -8px #FFB800" : `0 10px 20px -10px ${card.c}` }}
        >
          <img src={avatarOf(card.world)} alt="" className="aspect-square w-full rounded-full object-cover" draggable={false} />
        </span>
      </motion.span>
    </motion.button>
  );
}

export default function Memory() {
  const { progress } = useSession();
  const [phase, setPhase] = useState("intro");
  const [cards, setCards] = useState(deal);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const [result, setResult] = useState(null);
  const lock = useRef(false);

  useEffect(() => {
    if (phase !== "play") return undefined;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function flip(k) {
    if (lock.current || open.includes(k) || matched.includes(cards[k].world)) return;
    const next = [...open, k];
    setOpen(next);
    if (next.length < 2) return;
    const m = moves + 1;
    setMoves(m);
    lock.current = true;
    const [a, b] = next.map((x) => cards[x]);
    if (a.world === b.world) {
      setTimeout(() => {
        const done = [...matched, a.world];
        setMatched(done); setOpen([]); lock.current = false;
        if (done.length === WORLDS.length) {
          const score = Math.max(0, 1000 - (m - WORLDS.length) * 40 - secs * 5);
          setTimeout(() => {
            setResult({ ...finishGame({ id: "memoria", kind: "memoria", score, xp: gameXp.memoria({ moves: m }) }), score, moves: m });
            setPhase("done");
          }, 700);
        }
      }, 350);
    } else {
      setTimeout(() => { setOpen([]); lock.current = false; }, 850);
    }
  }

  function replay() {
    setCards(deal()); setOpen([]); setMatched([]); setMoves(0); setSecs(0); setResult(null); lock.current = false; setPhase("play");
  }

  const icon = <span className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: COLOR }}><Icon name="grid" size={22} /></span>;

  if (phase === "intro") {
    return (
      <Frame title="Memória dos Mascotes" color={COLOR} icon={icon}>
        <Intro
          art={<div className="grid grid-cols-3 gap-2">{WORLDS.map((w, i) => <motion.img key={w.id} src={avatarOf(w.id)} alt="" className="h-16 w-16 rounded-2xl border-[3px] border-white object-cover shadow" animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity, repeatDelay: 2 }} />)}</div>}
          rules={["Vire duas cartas por vez.", "Achou o par? Ele fica aberto.", "Menos jogadas e menos tempo = mais pontos.", "Gabarito perfeito: 6 jogadas."]}
          best={progress?.games.best.memoria}
          onStart={() => setPhase("play")}
        />
      </Frame>
    );
  }

  if (phase === "done") {
    const stars = result.moves <= 9 ? 3 : result.moves <= 13 ? 2 : 1;
    return (
      <Frame title="Memória dos Mascotes" color={COLOR} icon={icon}>
        <Result title={stars === 3 ? "Memória de elefante!" : "Todos os pares!"} score={result.score} unit="pontos" stars={stars} details={`${result.moves} jogadas em ${secs}s`} result={result} onReplay={replay} />
      </Frame>
    );
  }

  return (
    <Frame
      title="Memória dos Mascotes" color={COLOR} icon={icon}
      stats={<>
        <Stat icon="refresh">{moves} jogadas</Stat>
        <Stat icon="timer">{secs}s</Stat>
        <Stat icon="check">{matched.length}/{WORLDS.length}</Stat>
      </>}
    >
      <div className="mx-auto grid max-w-[560px] grid-cols-4 gap-2 sm:gap-3">
        {cards.map((c, k) => (
          <Card key={c.key} index={k} card={c} up={open.includes(k) || matched.includes(c.world)} matched={matched.includes(c.world)} onFlip={() => flip(k)} />
        ))}
      </div>
    </Frame>
  );
}
