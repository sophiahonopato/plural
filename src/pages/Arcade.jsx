import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { WORLDS, avatarOf } from "../data/categories";
import { GAMES, GAME_CAP } from "../data/game";
import { QUIZ } from "../data/quiz";
import { useSession } from "../lib/session";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import Tilt from "../components/Tilt";

const list = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { y: 40, opacity: 0, rotateX: -20 }, show: { y: 0, opacity: 1, rotateX: 0, transition: { type: "spring", stiffness: 200, damping: 20 } } };

// Ícones que flutuam atrás do título
const FLOATERS = [
  { icon: "gamepad", c: "#2D9CFF", x: "6%", y: "18%", r: -14 },
  { icon: "star", c: "#FFC21A", x: "88%", y: "10%", r: 12 },
  { icon: "bolt", c: "#FF8A1F", x: "80%", y: "70%", r: -8 },
  { icon: "trophy", c: "#A24BFF", x: "12%", y: "78%", r: 10 },
  { icon: "help", c: "#FF2D87", x: "50%", y: "-4%", r: 0 },
];

export default function Arcade() {
  const { user, progress } = useSession();
  const today = progress?.daily.gameXp || 0;
  const best = (id) => progress?.games.best[id];

  return (
    <div className="mx-auto max-w-6xl px-5 pt-28" style={{ "--c": "#8B3DFF" }}>
      <header className="relative py-6 text-center">
        {FLOATERS.map((f, i) => (
          <motion.span
            key={f.icon} aria-hidden="true"
            className="absolute hidden h-14 w-14 place-items-center rounded-2xl text-white shadow-lg sm:grid"
            style={{ left: f.x, top: f.y, background: f.c }}
            initial={{ scale: 0, rotate: f.r * 3 }}
            animate={{ scale: 1, rotate: f.r, y: [0, -12, 0] }}
            transition={{ scale: { type: "spring", delay: 0.2 + i * 0.08 }, y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" } }}
          >
            <Icon name={f.icon} fill={f.icon !== "help" && f.icon !== "gamepad"} size={26} />
          </motion.span>
        ))}
        <motion.p initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="kicker justify-center"><Icon name="gamepad" size={14} /> Arcade Plural</motion.p>
        <motion.h1
          className="display mt-3 text-5xl font-black sm:text-7xl"
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 14 }}
        >
          Jogue e ganhe <span className="text-[#E8A400]">XP</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mx-auto mt-4 max-w-lg text-lg text-mist">
          Mini jogos rápidos e um quiz pra cada mundo. Bata seus recordes e desbloqueie conquistas.
        </motion.p>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="panel mx-auto mt-8 max-w-md p-4 text-left">
          {user ? (
            <>
              <div className="flex justify-between text-sm font-extrabold">
                <span>XP do Arcade hoje</span>
                <span className="tabular-nums text-[#8F5D00]">{today}/{GAME_CAP}</span>
              </div>
              <div className="xpbar mt-2"><motion.i initial={{ width: 0 }} animate={{ width: `${(today / GAME_CAP) * 100}%` }} transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.6 }} style={{ transition: "none" }} /></div>
              <p className="mt-2 text-xs text-mist">O limite volta todo dia. Depois dele, os recordes continuam valendo.</p>
            </>
          ) : (
            <p className="text-center text-sm font-bold text-mist">
              <Link to="/entrar?modo=criar" className="text-fg underline underline-offset-4">Crie sua conta</Link> para guardar XP e recordes. Dá pra jogar sem conta também.
            </p>
          )}
        </motion.div>
      </header>

      <section className="mt-10">
        <h2 className="display text-2xl font-black sm:text-3xl">Mini jogos</h2>
        <motion.div variants={list} initial="hidden" animate="show" className="mt-5 grid gap-5 [perspective:1200px] md:grid-cols-3">
          {GAMES.map((g) => (
            <motion.div key={g.id} variants={item}>
              <Link to={`/jogos/${g.id}`} className="group block h-full">
                <Tilt className="on-color h-full overflow-hidden rounded-[28px] border-[3px] border-white p-6 shadow-[0_30px_50px_-28px_rgba(60,30,120,.6)]" style={{ background: `linear-gradient(150deg, ${g.c}, color-mix(in srgb, ${g.c} 55%, #1A1030))` }}>
                  <motion.span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20" whileHover={{ rotate: [0, -12, 12, 0], scale: 1.1 }}>
                    <Icon name={g.icon} size={32} fill={g.icon === "bolt"} />
                  </motion.span>
                  <h3 className="display mt-6 text-2xl font-black">{g.name}</h3>
                  <p className="mt-2 min-h-[3em] text-fg/85">{g.desc}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="chip !border-white/40 !bg-white/20 !text-white">até +{g.max} XP</span>
                    <span className="text-sm font-bold text-fg/85">{best(g.id) !== undefined ? `Recorde: ${best(g.id)}` : "Novo!"}</span>
                  </div>
                  <span className="mt-6 flex items-center gap-2 font-extrabold transition-transform group-hover:translate-x-1">Jogar <Icon name="arrow-right" /></span>
                </Tilt>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="display text-2xl font-black sm:text-3xl">Quiz dos mundos</h2>
          <p className="text-sm font-bold text-mist">6 perguntas · 15s cada · combo até 3x</p>
        </div>
        <motion.div variants={list} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10%" }} className="mt-5 grid grid-cols-2 gap-4 [perspective:1200px] md:grid-cols-3">
          {WORLDS.map((w) => {
            const perfect = progress?.games.perfect.includes(w.id);
            return (
              <motion.div key={w.id} variants={item}>
                <Link to={`/jogos/quiz-${w.id}`} className="group block">
                  <Tilt max={10} className="panel overflow-hidden !p-0 transition-shadow group-hover:shadow-[0_24px_50px_-24px_var(--c)]" style={{ "--c": w.c }}>
                    <div className="relative h-24 sm:h-28" style={{ background: `linear-gradient(135deg, ${w.c}, ${w.deep})` }}>
                      <motion.img
                        src={avatarOf(w.id)} alt="" className="absolute -bottom-8 left-5 h-20 w-20 rounded-full border-4 border-white object-cover sm:h-24 sm:w-24"
                        whileHover={{ rotate: -10, scale: 1.08 }}
                      />
                      {perfect && <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#FFC21A] text-[#7A4D00] shadow" title="Gabaritado"><Icon name="crown" size={18} /></span>}
                      <span className="display absolute right-4 bottom-2 text-5xl font-black text-white/20">?</span>
                    </div>
                    <div className="p-5 pt-10 sm:pt-12">
                      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-mist">Quiz com {w.mascot}</p>
                      <h3 className="display mt-1 text-lg font-black leading-tight sm:text-xl">{w.name}</h3>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
                        <span className="text-mist">{QUIZ[w.id].length} perguntas no banco</span>
                        <span className="world-text">{best(`quiz-${w.id}`) !== undefined ? `${best(`quiz-${w.id}`)} pts` : "Jogar →"}</span>
                      </div>
                    </div>
                  </Tilt>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
