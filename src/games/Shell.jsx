import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GAME_CAP } from "../data/game";
import { useSession } from "../lib/session";
import { confetti } from "../components/GameFX";
import CountUp from "../components/CountUp";
import Icon from "../components/Icon";

export const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Moldura de todos os jogos: título, voltar e uma faixa de status.
export function Frame({ title, color, icon, children, stats }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-24" style={{ "--c": color }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/jogos" className="chip hover:bg-fg/10"><Icon name="arrow-left" size={13} /> Arcade</Link>
        <div className="flex flex-wrap gap-2">{stats}</div>
      </div>
      <h1 className="display mt-4 flex items-center gap-3 text-2xl font-black sm:text-3xl">
        {icon}
        {title}
      </h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function Stat({ icon, children, tone = "" }) {
  return (
    <motion.span layout className={`chip !py-1.5 text-sm tabular-nums ${tone}`}>
      <Icon name={icon} size={14} fill={icon === "bolt" || icon === "flame"} />
      {children}
    </motion.span>
  );
}

// Tela inicial: regras + botão; ao apertar, conta 3-2-1 e chama onStart.
export function Intro({ art, rules, onStart, best }) {
  const [count, setCount] = useState(null);
  const { user, progress } = useSession();
  const left = progress ? Math.max(0, GAME_CAP - progress.daily.gameXp) : null;

  useEffect(() => {
    if (count === null) return undefined;
    if (count === 0) { onStart(); return undefined; }
    const t = setTimeout(() => setCount((c) => c - 1), 650);
    return () => clearTimeout(t);
  }, [count, onStart]);

  return (
    <div className="panel relative overflow-hidden p-6 text-center sm:p-10">
      <AnimatePresence>
        {count !== null && count > 0 && (
          <motion.div
            className="absolute inset-0 z-10 grid place-items-center bg-surface/90 backdrop-blur"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                className="display text-[9rem] font-black text-[color:var(--c)]"
                initial={{ scale: 2.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.3, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ scale: 0.6, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="mx-auto w-fit">
        {art}
      </motion.div>
      <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
        {rules.map((r, i) => (
          <motion.li key={r} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.08 }} className="flex items-start gap-3 text-[17px] text-fg/85">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black text-white" style={{ background: "var(--c)" }}>{i + 1}</span>
            {r}
          </motion.li>
        ))}
      </ul>
      {best !== undefined && <p className="mt-6 text-sm font-bold text-mist">Seu recorde: <b className="text-fg">{best}</b></p>}
      <motion.button
        type="button" onClick={() => setCount(3)} className="btn btn-lg btn-world mt-6"
        animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
      >
        <Icon name="gamepad" /> Jogar
      </motion.button>
      <p className="mt-4 text-sm text-mist">
        {!user ? <><Link to="/entrar" className="font-bold text-fg underline underline-offset-4">Entre</Link> para guardar o XP e os recordes.</>
          : left > 0 ? <>Ainda dá pra ganhar <b className="text-fg">{left} XP</b> no Arcade hoje.</>
          : "Você já pegou todo o XP do Arcade hoje. Jogue pelo recorde!"}
      </p>
    </div>
  );
}

// Tela final. `stars` de 0 a 3.
export function Result({ title, score, unit, stars, result, details, onReplay, children }) {
  useEffect(() => {
    if (stars >= 2) confetti(window.innerWidth / 2, window.innerHeight / 3, 60 + stars * 30);
  }, [stars]);

  return (
    <motion.div initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="panel p-6 text-center sm:p-10">
      <p className="kicker justify-center">Fim de jogo</p>
      <h2 className="display mt-2 text-3xl font-black sm:text-4xl">{title}</h2>
      <div className="mt-6 flex justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.3 + i * 0.18 }}
            className={i < stars ? "text-[#FFC21A] drop-shadow-[0_6px_10px_rgba(255,180,0,.45)]" : "text-fg/15"}
          >
            <Icon name="star" fill size={i === 1 ? 64 : 48} strokeWidth={1} />
          </motion.span>
        ))}
      </div>
      <p className="display mt-6 text-6xl font-black tabular-nums text-[color:var(--c)]"><CountUp value={score} /></p>
      <p className="font-bold text-mist">{unit}</p>
      {details && <p className="mt-2 text-sm text-mist">{details}</p>}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {result.record && !result.guest && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.9 }} className="chip chip-gold !px-4 !py-2 text-sm">
            <Icon name="trophy" size={14} /> Novo recorde!
          </motion.span>
        )}
        {result.guest ? (
          <span className="chip !px-4 !py-2 text-sm"><Link to="/entrar" className="underline underline-offset-4">Entre</Link>&nbsp;para guardar XP e recordes</span>
        ) : result.granted > 0 ? (
          <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }} className="chip chip-gold !px-4 !py-2 text-sm">
            <Icon name="bolt" fill size={14} /> +{result.granted} XP{result.capped ? " (limite diário)" : ""}
          </motion.span>
        ) : (
          <span className="chip !px-4 !py-2 text-sm">{result.capped ? "Limite de XP do Arcade atingido hoje" : "Sem XP desta vez"}</span>
        )}
      </div>

      {children}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-lg btn-world" onClick={onReplay}><Icon name="refresh" /> Jogar de novo</button>
        <Link to="/jogos" className="btn btn-lg btn-ghost">Outros jogos</Link>
      </div>
    </motion.div>
  );
}

// "+25" que sobe e some
export function FloatText({ items }) {
  return (
    <AnimatePresence>
      {items.map((f) => (
        <motion.span
          key={f.id}
          className="pointer-events-none absolute z-20 display text-2xl font-black"
          style={{ left: f.x, top: f.y, color: f.color }}
          initial={{ y: 0, opacity: 1, scale: 0.6 }}
          animate={{ y: -60, opacity: 0, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {f.text}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}
