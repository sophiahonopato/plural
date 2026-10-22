import { useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { gsap, useGSAP, reducedMotion } from "../lib/gsap";
import { WORLDS, bannerOf, worldById } from "../data/categories";
import { BLOGS } from "../data/blogs";
import { XP, missionKey, readIn } from "../data/game";
import { useSession } from "../lib/session";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import { PostCard } from "../components/Post";

export function Ring({ value, total, size = 96, color }) {
  const r = (size - 12) / 2;
  const C = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(26,16,48,.1)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - value / total)} style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <span className="display absolute text-xl font-black">{value}<span className="text-sm text-fg/50">/{total}</span></span>
    </span>
  );
}

export default function World() {
  const { worldId } = useParams();
  const w = worldById(worldId);
  const root = useRef(null);
  const { state, progress } = useSession();

  useGSAP(() => {
    if (!w || reducedMotion()) return;
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".w-banner", { scale: 1.15, opacity: 0, duration: 1.2 })
      .from(".w-head > *", { y: 40, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.2);
    gsap.to(".w-banner", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".w-hero", start: "top top", end: "bottom top", scrub: true } });

    // o caminho "acende" conforme o scroll e cada fase pula pra dentro
    gsap.fromTo(".w-path-fill", { scaleY: 0 }, {
      scaleY: 1, ease: "none", transformOrigin: "50% 0%",
      scrollTrigger: { trigger: ".w-path", start: "top 70%", end: "bottom 60%", scrub: 0.5 },
    });
    gsap.utils.toArray(".w-node").forEach((node, i) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: node, start: "top 85%" } });
      tl.from(node.querySelector(".w-dot"), { scale: 0, rotation: -90, duration: 0.6, ease: "back.out(2.5)" })
        .from(node.querySelector(".w-card"), { x: i % 2 ? -40 : 40, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.4");
    });
  }, { scope: root, dependencies: [worldId], revertOnUpdate: true });

  if (!w) return <Navigate to="/" replace />;

  const missions = BLOGS[w.id];
  const done = progress ? readIn(progress, w.id) : 0;
  const isDone = (i) => !!progress && progress.read.includes(missionKey(w.id, i));
  const next = missions.findIndex((_, i) => !isDone(i));
  const talk = state.posts.filter((p) => p.topic === w.id && !p.replyTo).slice(0, 3);

  return (
    <div ref={root} key={w.id} style={{ "--c": w.c, "--deep": w.deep }}>
      <section className="w-hero relative overflow-hidden px-3 pt-20">
        <div className="on-color relative mx-auto max-w-6xl overflow-hidden rounded-[32px]" style={{ background: w.deep }}>
          <img src={bannerOf(w.id)} alt={`${w.mascot}, mascote de ${w.name}`} width={1686} height={498} className="w-banner h-[300px] w-full object-cover sm:h-[420px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0718]/90 via-[#0B0718]/30 to-transparent" />
          <div className="w-head absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-5 p-6 sm:p-10">
            <div>
              <Link to="/#mundos" className="chip mb-4 hover:bg-fg/15"><Icon name="arrow-left" size={13} /> Todos os mundos</Link>
              <p className="kicker world-text">Guia: {w.mascot}</p>
              <h1 className="display mt-2 text-4xl font-black sm:text-6xl">{w.name}</h1>
              <p className="mt-3 max-w-lg text-lg text-fg/80">{w.desc}</p>
            </div>
            <Ring value={done} total={missions.length} color={w.c} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-14 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="display text-2xl font-black sm:text-3xl">Trilha de missões</h2>
          <p className="mt-2 text-mist">Cinco fases. Cada uma vale <b className="text-gold">+{XP.read} XP</b>.</p>

          <ol className="w-path relative mt-10 space-y-6">
            <span className="path-dash absolute bottom-10 left-[31px] top-10 w-1 rounded sm:left-1/2 sm:-ml-0.5" />
            <span className="w-path-fill absolute bottom-10 left-[31px] top-10 w-1 rounded sm:left-1/2 sm:-ml-0.5" style={{ background: w.c, boxShadow: `0 0 16px ${w.c}` }} />
            {missions.map((m, i) => {
              const ok = isDone(i);
              const current = i === next;
              return (
                <li key={m.title} className={`w-node relative flex items-center gap-5 sm:gap-0 ${i % 2 ? "sm:flex-row-reverse" : ""}`}>
                  <div className="order-2 min-w-0 flex-1 sm:order-none">
                    <Link
                      to={`/mundo/${w.id}/${i}`}
                      className={`w-card panel group block p-5 transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-[color:var(--c)] ${i % 2 ? "sm:ml-10" : "sm:mr-10"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip chip-world">Fase {i + 1}</span>
                        {ok ? <span className="chip chip-gold"><Icon name="check" size={12} strokeWidth={3.5} /> Concluída</span>
                          : <span className="chip"><Icon name="bolt" fill size={12} className="text-gold" /> +{XP.read} XP</span>}
                        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-mist"><Icon name="clock" size={13} /> {m.readTime}</span>
                      </div>
                      <h3 className="display mt-3 text-lg font-bold leading-snug group-hover:text-fg">{m.title}</h3>
                      <p className="mt-2 line-clamp-2 text-mist">{m.intro}</p>
                    </Link>
                  </div>
                  <span
                    className={`w-dot relative z-10 order-1 grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-surface font-display text-xl font-black sm:order-none ${current ? "floaty" : ""}`}
                    style={ok || current
                      ? { background: w.c, boxShadow: `0 6px 0 ${w.deep}, 0 0 30px ${w.c}88`, color: "#fff" }
                      : { background: "#EEEAF8", boxShadow: "0 6px 0 #D8D1EC", color: "#8A82A8" }}
                  >
                    {ok ? <Icon name="check" size={26} strokeWidth={3.5} /> : i + 1}
                  </span>
                  <div className="hidden flex-1 sm:block" />
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-5">
            <div className="flex items-center gap-3">
              <Avatar mascot={w.id} size={52} />
              <div>
                <p className="font-extrabold">{w.mascot}</p>
                <p className="text-sm text-mist">@{w.handle} · seu guia aqui</p>
              </div>
            </div>
            <p className="mt-4 leading-relaxed text-fg/85">“{w.welcome}”</p>
            <Link to={`/comunidade?topico=${w.id}`} className="btn btn-world mt-5 w-full"><Icon name="message" /> Entrar no papo</Link>
          </div>

          <Link to={`/jogos/quiz-${w.id}`} className="on-color group relative block overflow-hidden rounded-[24px] p-5 shadow-[0_20px_40px_-24px_var(--c)]" style={{ background: `linear-gradient(135deg, ${w.c}, ${w.deep})` }}>
            <span className="display pointer-events-none absolute -right-2 -top-6 text-[7rem] font-black text-white/15 transition-transform group-hover:rotate-12">?</span>
            <p className="kicker">Quiz</p>
            <p className="display mt-1 text-xl font-black">Quanto você sabe de {w.name.split(" ")[0]}?</p>
            <p className="mt-1 text-sm text-fg/85">6 perguntas, combo e até +68 XP.</p>
            <span className="mt-4 inline-flex items-center gap-2 font-extrabold transition-transform group-hover:translate-x-1">Jogar agora <Icon name="arrow-right" /></span>
          </Link>

          {talk.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-fg/50">Rolando na comunidade</h2>
              <div className="space-y-3">{talk.map((p) => <PostCard key={p.id} post={p} />)}</div>
            </div>
          )}

          <div className="panel p-5">
            <h2 className="text-xs font-extrabold uppercase tracking-[.2em] text-fg/50">Outros mundos</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {WORLDS.filter((x) => x.id !== w.id).map((x) => (
                <Link key={x.id} to={`/mundo/${x.id}`} title={x.name} className="transition-transform hover:-translate-y-1 hover:scale-110">
                  <Avatar mascot={x.id} size={44} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
