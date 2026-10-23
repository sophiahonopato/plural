import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { gsap, useGSAP, reducedMotion } from "../lib/gsap";
import { WORLDS, wideOf, worldById } from "../data/categories";
import { BLOGS } from "../data/blogs";
import { BADGES, TOTAL_MISSIONS, levelInfo, readIn } from "../data/game";
import { useSession } from "../lib/session";
import { ONLINE, isAdmin, loadUser, logOut, progressOf, rankOf, updateProfile } from "../lib/store";
import Loading from "../components/Loading";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import Tilt from "../components/Tilt";
import CountUp from "../components/CountUp";
import { PostCard } from "../components/Post";

function Editor({ user, onClose }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [mascot, setMascot] = useState(user.mascot);
  function save(e) {
    e.preventDefault();
    updateProfile({ name, bio, mascot });
    onClose();
  }
  return (
    <form onSubmit={save} className="panel mt-6 space-y-4 p-5 sm:p-6" style={{ "--c": worldById(mascot).c }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Nome</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} minLength={2} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Bio <span className="font-medium text-mist">({140 - bio.length})</span></span>
          <input className="input" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={140} placeholder="Uma linha sobre você" />
        </label>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Personagem</legend>
        <div className="flex flex-wrap gap-3" role="radiogroup">
          {WORLDS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={x.id === mascot} aria-label={x.mascot} onClick={() => setMascot(x.id)} className={`rounded-full transition-opacity ${x.id === mascot ? "" : "opacity-45 hover:opacity-90"}`}>
              <Avatar mascot={x.id} size={52} ring={x.id === mascot} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-world">Salvar</button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { handle } = useParams();
  const root = useRef(null);
  const navigate = useNavigate();
  const { state, user: me } = useSession();
  const [editing, setEditing] = useState(false);
  const user = handle ? state.users.find((u) => u.handle === handle) : me;
  // perfil de outra pessoa que ainda não veio do banco: busca na hora
  const [lookup, setLookup] = useState({});
  useEffect(() => {
    if (!ONLINE || !handle || user || lookup[handle]) return;
    setLookup((l) => ({ ...l, [handle]: "loading" }));
    loadUser(handle).then((found) => setLookup((l) => ({ ...l, [handle]: found ? "done" : "missing" })));
  }, [handle, user, lookup]);
  const [rank, setRank] = useState(null);
  const xpNow = user ? progressOf(state, user.id).xp : 0;
  useEffect(() => {
    if (user) rankOf(user.id).then(setRank);
  }, [user?.id, xpNow]);

  useGSAP(() => {
    if (!user || reducedMotion()) return;
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".p-banner", { scale: 1.12, opacity: 0, duration: 1 })
      .from(".p-avatar", { scale: 0, rotation: -30, duration: 0.7, ease: "back.out(2)" }, 0.2)
      .from(".p-head > *", { y: 24, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.35)
      .from(".p-stat", { y: 30, opacity: 0, scale: 0.9, duration: 0.5, stagger: 0.06, ease: "back.out(1.8)" }, 0.5);
    gsap.from(".p-badge", { scale: 0, rotation: -25, duration: 0.5, stagger: 0.035, ease: "back.out(2)", scrollTrigger: { trigger: ".p-badges", start: "top 88%" } });
    gsap.from(".p-world > i", { scaleX: 0, transformOrigin: "0 50%", duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".p-worlds", start: "top 88%" } });
  }, { scope: root, dependencies: [user?.id], revertOnUpdate: true });

  if (!state.ready || (handle && !user && lookup[handle] !== "missing")) return <Loading label="Carregando perfil…" />;
  if (!user) return <Navigate to={handle ? "/comunidade" : "/entrar"} replace />;

  const mine = !!me && me.id === user.id;
  const w = worldById(user.mascot);
  const p = progressOf(state, user.id);
  const lv = levelInfo(p.xp);
  const posts = state.posts.filter((x) => x.userId === user.id && !x.replyTo);
  const stats = [
    { icon: "bolt", label: "XP total", value: <CountUp value={p.xp} />, c: "#E8A400" },
    { icon: "book", label: "Missões", value: `${p.read.length}/${TOTAL_MISSIONS}`, c: "#2D9CFF" },
    { icon: "send", label: "Posts", value: <CountUp value={p.posts} />, c: "#FF2D87" },
    { icon: "flame", label: "Sequência", value: `${p.streak} ${p.streak === 1 ? "dia" : "dias"}`, c: "#FF8A1F" },
    { icon: "trophy", label: "No ranking", value: rank ? `#${rank}` : "…", c: "#A24BFF", to: "/ranking" },
  ];

  return (
    <div ref={root} key={user.id} className="mx-auto max-w-5xl px-4 pt-20" style={{ "--c": w.c, "--deep": w.deep }}>
      <div className="relative overflow-hidden rounded-[32px] border border-fg/15" style={{ background: w.deep }}>
        <div className="p-banner art h-44 sm:h-60" style={{ "--img": `url(${wideOf(w.id)})`, backgroundSize: "cover", backgroundPosition: "center 38%" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="relative -mt-14 flex flex-wrap items-end gap-5 px-2 sm:px-6">
        <span className="p-avatar"><Avatar mascot={user.mascot} size={120} /></span>
        <div className="p-head min-w-0 flex-1 pb-1">
          <h1 className="display truncate text-3xl font-black sm:text-4xl">{user.name}</h1>
          <p className="mt-1 text-mist">@{user.handle} · joga com {w.mascot}</p>
          {user.bio && <p className="mt-2 max-w-xl text-fg/85">{user.bio}</p>}
        </div>
        {mine && (
          <div className="flex gap-2 pb-1">
            {isAdmin(me) && <Link to="/admin" className="btn btn-sm btn-ghost"><Icon name="shield" size={15} /> Moderação</Link>}
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing((v) => !v)}><Icon name="edit" size={15} /> Editar</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { logOut(); navigate("/"); }}><Icon name="logout" size={15} /> Sair</button>
          </div>
        )}
      </div>

      {mine && editing && <Editor user={user} onClose={() => setEditing(false)} />}

      {/* nível */}
      <section className="panel mt-8 flex flex-wrap items-center gap-6 p-6">
        <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] bg-gradient-to-b from-[#FFE27A] to-[#FFB800] shadow-[0_7px_0_#a86f00]">
          <span className="display text-5xl font-black text-[#3A2500]">{lv.level}</span>
        </span>
        <div className="min-w-[220px] flex-1">
          <p className="kicker">Nível {lv.level}</p>
          <p className="display mt-1 text-2xl font-black">{lv.title}</p>
          <div className="xpbar mt-4 !h-4"><motion.i initial={{ width: 0 }} animate={{ width: `${lv.pct}%` }} transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.4 }} style={{ transition: "none" }} /></div>
          <p className="mt-2 text-sm font-bold text-mist">{lv.into} / {lv.need} XP · faltam {lv.need - lv.into} pro nível {lv.level + 1}</p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => {
          const Box = s.to ? Link : "div";
          return (
          <Box key={s.label} to={s.to} className={`p-stat panel block p-5 ${s.to ? "transition-transform hover:-translate-y-1" : ""}`}>
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${s.c}22`, color: s.c }}><Icon name={s.icon} fill={s.icon !== "book" && s.icon !== "send"} size={18} /></span>
            <p className="display mt-4 text-2xl font-black tabular-nums">{s.value}</p>
            <p className="text-sm font-bold text-mist">{s.label}</p>
          </Box>
          );
        })}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <h2 className="display text-xl font-black">Conquistas <span className="text-mist">{p.badges.length}/{BADGES.length}</span></h2>
          <div className="p-badges mt-5 grid grid-cols-3 gap-3 [perspective:1000px] sm:grid-cols-4">
            {BADGES.map((b) => {
              const on = p.badges.includes(b.id);
              return (
                <Tilt key={b.id} max={16} className="p-badge rounded-3xl p-3 text-center" style={{ background: on ? `${b.c}1f` : "rgba(26,16,48,.03)", boxShadow: `inset 0 0 0 2px ${on ? `${b.c}88` : "rgba(26,16,48,.08)"}` }} title={b.desc}>
                  <span className={`mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-2xl ${on ? "" : "grayscale"}`} style={{ background: `${b.c}26`, color: on ? b.c : "#A9A1C6" }}>
                    {!on ? <Icon name="lock" size={22} /> : b.world ? <Avatar mascot={b.world} size={56} ring={false} /> : <Icon name={b.icon} fill size={24} />}
                  </span>
                  <p className={`mt-2 text-xs font-extrabold leading-tight ${on ? "" : "text-fg/70"}`}>{b.name}</p>
                  <p className="mt-1 text-[11px] leading-snug text-mist">{b.desc}</p>
                </Tilt>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="display text-xl font-black">Mundos</h2>
          <ul className="p-worlds mt-5 space-y-4">
            {WORLDS.map((x) => {
              const n = readIn(p, x.id);
              const total = BLOGS[x.id].length;
              return (
                <li key={x.id}>
                  <Link to={`/mundo/${x.id}`} className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-fg/5">
                    <Avatar mascot={x.id} size={40} />
                    <span className="flex-1">
                      <span className="flex justify-between text-sm font-bold"><span>{x.name}</span><span className="text-mist">{n}/{total}</span></span>
                      <span className="p-world xpbar mt-1.5 !h-2"><i style={{ width: `${(n / total) * 100}%`, background: x.c, boxShadow: `0 0 10px ${x.c}` }} /></span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="display text-xl font-black">Posts</h2>
        <div className="mt-5 space-y-3">
          {posts.map((x) => <PostCard key={x.id} post={x} />)}
          {posts.length === 0 && (
            <div className="panel p-8 text-center">
              <p className="font-bold text-mist">{mine ? "Você ainda não publicou nada." : "Nenhum post por enquanto."}</p>
              {mine && <Link to="/comunidade" className="btn btn-world mt-4">Escrever o primeiro post</Link>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
