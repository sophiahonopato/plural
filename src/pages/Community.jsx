import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { gsap, useGSAP, reducedMotion } from "../lib/gsap";
import { WORLDS, worldById } from "../data/categories";
import { DAILY, levelInfo } from "../data/game";
import { useSession } from "../lib/session";
import { progressOf } from "../lib/store";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import { Composer, PostCard } from "../components/Post";

function SideTitle({ icon, children }) {
  return <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.2em] text-fg/50"><Icon name={icon} size={14} />{children}</h2>;
}

export default function Community() {
  const root = useRef(null);
  const { state, user, progress, level } = useSession();
  const [params, setParams] = useSearchParams();
  const topic = worldById(params.get("topico")) ? params.get("topico") : null;
  const savedOnly = params.get("salvos") === "1" && !!user;
  const w = worldById(topic);

  const roots = state.posts.filter((p) => !p.replyTo);
  const feed = roots.filter((p) => (savedOnly ? progress.bookmarks.includes(p.id) : !topic || p.topic === topic));
  const countOf = (id) => roots.filter((p) => p.topic === id).length;
  const trending = [...WORLDS].sort((a, b) => countOf(b.id) - countOf(a.id));
  const ranking = state.users
    .map((u) => ({ u, xp: progressOf(state, u.id).xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  const pick = (next) => setParams(next ? { topico: next } : {}, { preventScrollReset: true });

  useGSAP(() => {
    if (!reducedMotion()) gsap.from(".side > *", { y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" });
  }, { scope: root });

  return (
    <div ref={root} className="mx-auto grid max-w-6xl gap-6 px-4 pt-24 lg:grid-cols-[230px_minmax(0,1fr)_300px]" style={{ "--c": w?.c || "#8B3DFF" }}>
      {/* ---------- esquerda: tópicos ---------- */}
      <aside className="side hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
        {user ? (
          <Link to="/perfil" className="panel flex items-center gap-3 p-4 transition-colors hover:border-fg/25">
            <Avatar mascot={user.mascot} size={46} />
            <span className="min-w-0">
              <b className="block truncate">{user.name}</b>
              <span className="text-sm font-bold text-gold">Nível {level.level} · {progress.xp} XP</span>
            </span>
          </Link>
        ) : (
          <div className="panel p-4">
            <p className="font-bold">Entre pra publicar, curtir e ganhar XP.</p>
            <Link to="/entrar?modo=criar" className="btn btn-sm btn-gold mt-3 w-full">Criar conta</Link>
          </div>
        )}
        <nav className="panel p-2" aria-label="Tópicos">
          <TopicButton active={!topic && !savedOnly} onClick={() => pick(null)} icon={<span className="grid h-8 w-8 place-items-center rounded-full bg-brand"><Icon name="sparkles" fill size={15} /></span>} label="Tudo" count={roots.length} />
          {WORLDS.map((x) => (
            <TopicButton key={x.id} active={topic === x.id && !savedOnly} onClick={() => pick(x.id)} icon={<Avatar mascot={x.id} size={32} ring={false} />} label={x.name.split(" ")[0]} count={countOf(x.id)} color={x.c} />
          ))}
          {user && (
            <TopicButton active={savedOnly} onClick={() => setParams({ salvos: "1" }, { preventScrollReset: true })} icon={<span className="grid h-8 w-8 place-items-center rounded-full bg-fg/10 text-gold"><Icon name="bookmark" fill size={15} /></span>} label="Salvos" count={progress.bookmarks.length} />
          )}
        </nav>
      </aside>

      {/* ---------- centro: feed ---------- */}
      <main className="min-w-0">
        <header className="flex items-center gap-4">
          {w ? <Avatar mascot={w.id} size={56} /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-brand"><Icon name={savedOnly ? "bookmark" : "users"} size={26} /></span>}
          <div>
            <h1 className="display text-2xl font-black sm:text-3xl">{savedOnly ? "Posts salvos" : w ? w.name : "Comunidade"}</h1>
            <p className="text-mist">{savedOnly ? "O que você guardou pra ler de novo." : w ? w.desc : "Escreva sobre o tópico que quiser. Todo mundo lê."}</p>
          </div>
        </header>

        {/* filtros no celular */}
        <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 py-1 lg:hidden">
          <button type="button" onClick={() => pick(null)} className={`chip relative !px-3.5 !py-2 ${!topic && !savedOnly ? "!text-surface" : ""}`}>
            {!topic && !savedOnly && <motion.span layoutId="m-topic" className="absolute inset-0 rounded-full bg-fg" />}
            <span className="relative">Tudo</span>
          </button>
          {WORLDS.map((x) => (
            <button key={x.id} type="button" onClick={() => pick(x.id)} className={`chip !py-1 !pl-1 ${topic === x.id ? "chip-world" : ""}`} style={{ "--c": x.c }}>
              <Avatar mascot={x.id} size={26} ring={false} />{x.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {!savedOnly && <div className="mt-5"><Composer key={topic || "all"} fixedTopic={topic || undefined} /></div>}

        <div className="feed mt-4 space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {feed.map((p, i) => (
              <motion.div
                key={p.id} layout
                initial={{ opacity: 0, y: -24, scale: 0.94, rotateX: -20 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -40, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 380, damping: 30, delay: Math.min(i, 6) * 0.03 }}
                style={{ transformPerspective: 900 }}
              >
                <PostCard post={p} />
              </motion.div>
            ))}
          </AnimatePresence>
          {feed.length === 0 && (
            <div className="panel p-10 text-center">
              {w && <Avatar mascot={w.id} size={72} className="floaty" />}
              <p className="display mt-4 text-xl font-bold">{savedOnly ? "Nada salvo ainda" : "Ninguém falou disso ainda"}</p>
              <p className="mt-2 text-mist">{savedOnly ? "Toque no marcador de um post pra guardar aqui." : "Seja a primeira pessoa a puxar o assunto."}</p>
            </div>
          )}
        </div>
      </main>

      {/* ---------- direita: jogo ---------- */}
      <aside className="side space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="panel p-5">
          <SideTitle icon="target">Missões de hoje</SideTitle>
          <ul className="mt-4 space-y-4">
            {DAILY.map((d) => {
              const value = Math.min(d.goal, progress?.daily[d.id] || 0);
              const ok = value >= d.goal;
              return (
                <li key={d.id}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ok ? "bg-gold text-ink-900" : "bg-fg/10 text-mist"}`}>
                      <Icon name={ok ? "check" : d.icon} size={16} strokeWidth={ok ? 3.5 : 2.2} />
                    </span>
                    <span className={`flex-1 text-sm font-bold leading-snug ${ok ? "text-mist line-through" : ""}`}>{d.label}</span>
                    <span className="text-xs font-extrabold text-gold">+{d.xp}</span>
                  </div>
                  <div className="xpbar mt-2 !h-1.5"><i style={{ width: `${(value / d.goal) * 100}%` }} /></div>
                </li>
              );
            })}
          </ul>
          {!user && <p className="mt-4 text-sm text-mist"><Link to="/entrar" className="font-bold text-fg underline underline-offset-4">Entre</Link> para começar a pontuar.</p>}
        </section>

        <section className="panel p-5">
          <SideTitle icon="trophy">Ranking</SideTitle>
          {ranking.length === 0 ? (
            <p className="mt-4 text-sm text-mist">Ainda não há jogadores por aqui. O primeiro lugar está vago.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {ranking.map(({ u, xp }, i) => (
                <li key={u.id}>
                  <Link to={`/u/${u.handle}`} className="flex items-center gap-3 rounded-xl transition-colors hover:bg-fg/5">
                    <span className={`display w-5 text-center text-sm font-black ${i === 0 ? "text-gold" : "text-mist"}`}>{i + 1}</span>
                    <Avatar mascot={u.mascot} size={34} />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{u.name}</b>
                      <span className="text-xs text-mist">Nível {levelInfo(xp).level}</span>
                    </span>
                    <span className="text-sm font-extrabold tabular-nums text-gold">{xp} XP</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel p-5">
          <SideTitle icon="flame">Tópicos em alta</SideTitle>
          <ul className="mt-4 space-y-2">
            {trending.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => pick(x.id)} className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-fg/5">
                  <span className="font-bold" style={{ color: `color-mix(in srgb, ${x.c} 85%, #1a1030)` }}>#{x.name.split(" ")[0]}</span>
                  <span className="text-xs font-bold text-mist">{countOf(x.id)} {countOf(x.id) === 1 ? "post" : "posts"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function TopicButton({ active, onClick, icon, label, count, color = "#8B3DFF" }) {
  return (
    <button
      type="button" onClick={onClick} aria-current={active ? "true" : undefined}
      className={`relative flex w-full items-center gap-3 rounded-2xl p-2 text-left font-bold transition-colors ${active ? "text-fg" : "text-mist hover:bg-fg/5 hover:text-fg"}`}
    >
      {active && (
        <motion.span
          layoutId="topic-pill" className="absolute inset-0 rounded-2xl"
          style={{ background: `${color}1f`, boxShadow: `inset 0 0 0 2px ${color}88` }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <span className="relative">{icon}</span>
      <span className="relative flex-1 truncate">{label}</span>
      <span className="relative pr-1 text-xs tabular-nums opacity-70">{count}</span>
    </button>
  );
}
