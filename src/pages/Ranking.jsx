import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { worldById } from "../data/categories";
import { levelInfo } from "../data/game";
import { useSession } from "../lib/session";
import { ONLINE, progressOf, rankOf } from "../lib/store";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import Loading from "../components/Loading";

const TOP = 50;
const PODIUM = [
  { place: 2, h: 120, c: "#C9D2E3", edge: "#9AA6BD" },
  { place: 1, h: 165, c: "#FFD23F", edge: "#C98A00" },
  { place: 3, h: 90, c: "#F2B48A", edge: "#B8743F" },
];

function Step({ entry, place, h, c, edge, delay }) {
  if (!entry) return <div className="flex-1" />;
  const { u, xp } = entry;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <motion.div
        initial={{ y: -60, opacity: 0, scale: 0.5 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: delay + 0.35 }}
        className="relative flex flex-col items-center"
      >
        {place === 1 && (
          <motion.span className="absolute -top-9 text-[#E8A400]" animate={{ y: [0, -6, 0], rotate: [-6, 6, -6] }} transition={{ duration: 2.4, repeat: Infinity }}>
            <Icon name="crown" size={34} fill />
          </motion.span>
        )}
        <Link to={`/u/${u.handle}`} className="transition-transform hover:scale-105">
          <Avatar mascot={u.mascot} size={place === 1 ? 92 : 72} />
        </Link>
        <Link to={`/u/${u.handle}`} className="mt-2 max-w-full truncate px-1 text-center text-sm font-extrabold hover:underline sm:text-base">{u.name}</Link>
        <span className="text-xs font-bold text-mist">@{u.handle}</span>
        <span className="chip chip-gold mt-1.5 tabular-nums">{xp} XP</span>
      </motion.div>
      <motion.div
        className="mt-3 grid w-full place-items-start justify-center rounded-t-3xl pt-3"
        style={{ background: `linear-gradient(180deg, ${c}, ${edge})`, boxShadow: `inset 0 -6px 0 ${edge}` }}
        initial={{ height: 0 }} animate={{ height: h }} transition={{ type: "spring", stiffness: 120, damping: 16, delay }}
      >
        <span className="display text-4xl font-black text-white/90 drop-shadow">{place}</span>
      </motion.div>
    </div>
  );
}

export default function Ranking() {
  const { state, user, progress } = useSession();
  const [myRank, setMyRank] = useState(null);

  const entries = state.users
    .map((u) => ({ u, xp: progressOf(state, u.id).xp }))
    .sort((a, b) => b.xp - a.xp || a.u.createdAt - b.u.createdAt)
    .slice(0, TOP);
  const mine = entries.findIndex((e) => e.u.id === user?.id);

  useEffect(() => {
    if (user) rankOf(user.id).then(setMyRank);
  }, [user?.id, progress?.xp]);

  if (!state.ready) return <Loading label="Carregando ranking…" />;

  // quem está logo acima de mim (pra mostrar quanto falta)
  const ahead = mine > 0 ? entries[mine - 1] : null;
  const podium = [entries[1], entries[0], entries[2]];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28">
      <header className="text-center">
        <motion.p initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="kicker justify-center"><Icon name="trophy" size={14} /> Temporada 1</motion.p>
        <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="display mt-3 text-5xl font-black sm:text-6xl">Ranking</motion.h1>
        <p className="mt-3 text-mist">
          {ONLINE ? (
            <span className="inline-flex items-center gap-2 font-bold">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2FCB5A] opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2FCB5A]" /></span>
              Ao vivo · todo mundo do Plural
            </span>
          ) : "Modo local: mostra só as contas criadas neste navegador."}
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="panel mt-10 p-10 text-center">
          <p className="display text-xl font-bold">Ninguém pontuou ainda</p>
          <p className="mt-2 text-mist">O primeiro lugar está vago. Que tal ser você?</p>
          <Link to={user ? "/jogos" : "/entrar?modo=criar"} className="btn btn-gold mt-5">{user ? "Ganhar XP no Arcade" : "Criar conta"}</Link>
        </div>
      ) : (
        <>
          <section className="mt-14 flex items-end gap-2 sm:gap-4" aria-label="Pódio">
            {PODIUM.map((s, k) => <Step key={s.place} entry={podium[k]} {...s} delay={[0.15, 0, 0.3][k]} />)}
          </section>

          <ol className="mt-6 space-y-2">
            <AnimatePresence initial={false}>
              {entries.slice(3).map(({ u, xp }, k) => {
                const me = u.id === user?.id;
                const w = worldById(u.mascot);
                return (
                  <motion.li
                    key={u.id} layout
                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: Math.min(k, 10) * 0.03 }}
                  >
                    <Link
                      to={`/u/${u.handle}`}
                      className={`panel flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5 sm:gap-4 sm:p-4 ${me ? "!border-[color:var(--c)] ring-4 ring-[color:var(--c)]/15" : ""}`}
                      style={{ "--c": w?.c }}
                    >
                      <span className="display w-8 text-center text-lg font-black text-mist">{k + 4}</span>
                      <Avatar mascot={u.mascot} size={42} />
                      <span className="min-w-0 flex-1">
                        <b className="block truncate">{u.name}{me && <span className="ml-2 text-xs text-brand-600">você</span>}</b>
                        <span className="text-xs text-mist">@{u.handle} · Nível {levelInfo(xp).level} {levelInfo(xp).title}</span>
                      </span>
                      <span className="font-extrabold tabular-nums text-[#8F5D00]">{xp} XP</span>
                    </Link>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </>
      )}

      {/* minha posição */}
      {user && myRank && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.6 }}
          className="sticky bottom-24 z-20 mt-8 md:bottom-6"
        >
          <div className="on-color flex flex-wrap items-center gap-3 rounded-3xl border-[3px] border-white bg-gradient-to-r from-[#7C1FE0] to-[#FF2D87] p-4 shadow-[0_24px_50px_-20px_rgba(124,31,224,.7)]">
            <span className="display grid h-12 min-w-12 place-items-center rounded-2xl bg-white/20 px-2 text-xl font-black">#{myRank}</span>
            <Avatar mascot={user.mascot} size={40} ring={false} />
            <span className="min-w-0 flex-1 text-sm">
              <b className="block">Sua posição · {progress.xp} XP</b>
              <span className="text-fg/85">
                {myRank === 1 ? "Você está no topo! Defenda o primeiro lugar."
                  : ahead ? `Faltam ${ahead.xp - progress.xp + 1} XP pra passar ${ahead.u.name}.`
                  : "Continue ganhando XP pra entrar no top 50."}
              </span>
            </span>
            <Link to="/jogos" className="btn btn-sm btn-gold">Ganhar XP</Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
