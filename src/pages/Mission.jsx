import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { gsap, useGSAP, reducedMotion } from "../lib/gsap";
import { worldById } from "../data/categories";
import { BLOGS } from "../data/blogs";
import { XP, missionKey } from "../data/game";
import { useSession } from "../lib/session";
import { completeMission } from "../lib/store";
import { confetti } from "../components/GameFX";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import { Composer, PostCard } from "../components/Post";

export default function Mission() {
  const { worldId, index: indexParam } = useParams();
  const index = Number(indexParam);
  const w = worldById(worldId);
  const blog = w && BLOGS[w.id][index];
  const root = useRef(null);
  const { state, user, progress } = useSession();
  const [checked, setChecked] = useState({});

  useGSAP(() => {
    if (!blog) return;
    // barra de leitura no topo acompanha o scroll do artigo
    gsap.fromTo(".m-progress", { scaleX: 0 }, {
      scaleX: 1, ease: "none", transformOrigin: "0 50%",
      scrollTrigger: { trigger: ".m-body", start: "top 30%", end: "bottom 75%", scrub: 0.3 },
    });
    if (reducedMotion()) return;
    gsap.from(".m-head > *", { y: 36, opacity: 0, duration: 0.8, stagger: 0.07, ease: "power4.out" });
    gsap.utils.toArray(".m-block").forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    gsap.utils.toArray(".m-tip").forEach((el) => {
      gsap.from(el, { x: -30, opacity: 0, duration: 0.6, ease: "back.out(1.6)", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
  }, { scope: root, dependencies: [worldId, index], revertOnUpdate: true });

  if (!blog) return <Navigate to={w ? `/mundo/${w.id}` : "/"} replace />;

  const done = !!progress && progress.read.includes(missionKey(w.id, index));
  const nextIndex = index + 1 < BLOGS[w.id].length ? index + 1 : null;
  const talk = state.posts.filter((p) => !p.replyTo && p.mission?.world === w.id && p.mission?.index === index);

  function finish(e) {
    const r = e.currentTarget.getBoundingClientRect();
    if (completeMission(w.id, index)) confetti(r.left + r.width / 2, r.top);
  }

  return (
    <div ref={root} key={`${w.id}-${index}`} style={{ "--c": w.c, "--deep": w.deep }}>
      <div className="fixed inset-x-0 top-0 z-[60] h-1.5 bg-fg/5">
        <div className="m-progress h-full" style={{ background: w.c, boxShadow: `0 0 12px ${w.c}` }} />
      </div>

      <article className="mx-auto max-w-3xl px-5 pt-28">
        <header className="m-head">
          <Link to={`/mundo/${w.id}`} className="chip chip-world hover:brightness-125"><Icon name="arrow-left" size={13} /> {w.name}</Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="chip">Fase {index + 1}</span>
            {blog.tagOverride && <span className="chip">{blog.tagOverride}</span>}
            <span className="chip"><Icon name="clock" size={12} /> {blog.readTime} de leitura</span>
            {done ? <span className="chip chip-gold"><Icon name="check" size={12} strokeWidth={3.5} /> Concluída</span>
              : <span className="chip chip-gold"><Icon name="bolt" fill size={12} /> +{XP.read} XP</span>}
          </div>
          <h1 className="display mt-5 text-3xl font-black leading-[1.08] sm:text-5xl">{blog.title}</h1>
          <div className="mt-6 flex items-center gap-3">
            <Avatar mascot={w.id} size={46} />
            <div className="text-sm">
              <p className="font-extrabold">{blog.author} <span className="font-medium text-mist">com {w.mascot}</span></p>
              <p className="text-mist">{blog.date}</p>
            </div>
          </div>
        </header>

        <div className="m-body mt-10">
          <p className="m-block text-xl leading-relaxed text-fg/90 sm:text-2xl sm:leading-relaxed">{blog.intro}</p>

          {blog.sections.map((s) => (
            <section key={s.heading} className="m-block mt-12">
              <h2 className="display text-2xl font-bold sm:text-[28px]">{s.heading}</h2>
              <p className="mt-4 text-[19px] leading-[1.75] text-fg/85 sm:text-xl">{s.text}</p>
              {s.tip && (
                <div className="m-tip mt-6 flex items-start gap-4 rounded-3xl p-5" style={{ background: `${w.c}1c`, boxShadow: `inset 0 0 0 2px ${w.c}55` }}>
                  <Avatar mascot={w.id} size={44} />
                  <p className="text-lg leading-relaxed text-fg/90">
                    <b className="world-text block text-xs uppercase tracking-[.18em]">Dica de {w.mascot}</b>
                    {s.tip}
                  </p>
                </div>
              )}
            </section>
          ))}

          {blog.quote && (
            <blockquote className="on-color m-block relative mt-12 overflow-hidden rounded-[28px] p-8 sm:p-10" style={{ background: `linear-gradient(135deg, ${w.c}, ${w.deep})` }}>
              <span className="display absolute -top-6 right-6 text-[10rem] font-black leading-none text-fg/15" aria-hidden="true">”</span>
              <p className="display relative max-w-lg text-2xl font-bold leading-snug sm:text-3xl">{blog.quote}</p>
              <footer className="relative mt-4 text-fg/75">— {blog.author}</footer>
            </blockquote>
          )}

          {blog.checklist && (
            <section className="m-block panel mt-12 p-6 sm:p-8">
              <h2 className="display text-xl font-bold">{blog.checklist.title}</h2>
              <ul className="mt-5 space-y-2">
                {blog.checklist.items.map((item, i) => (
                  <li key={item}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-fg/5">
                      <input type="checkbox" className="peer sr-only" checked={!!checked[i]} onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))} />
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-fg/25 text-transparent transition-all peer-checked:scale-110 peer-checked:border-transparent peer-checked:bg-[color:var(--c)] peer-checked:text-fg peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                        <Icon name="check" size={16} strokeWidth={3.5} />
                      </span>
                      <span className="text-lg text-fg/85 transition-opacity peer-checked:line-through peer-checked:opacity-50">{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* fim da missão */}
        <section className="m-block mt-14 overflow-hidden rounded-[28px] border-2 p-7 text-center sm:p-10" style={{ borderColor: `${w.c}66`, background: `radial-gradient(120% 120% at 50% 0%, ${w.c}33, transparent 70%)` }}>
          <Avatar mascot={w.id} size={84} className="floaty" />
          {done ? (
            <>
              <h2 className="display mt-5 text-2xl font-black sm:text-3xl">Missão concluída!</h2>
              <p className="mt-2 text-mist">O XP já está na sua conta. Que tal a próxima fase?</p>
            </>
          ) : (
            <>
              <h2 className="display mt-5 text-2xl font-black sm:text-3xl">Chegou ao fim?</h2>
              <p className="mt-2 text-mist">{user ? `Marque a missão como concluída e ganhe +${XP.read} XP.` : "Entre na sua conta para guardar o XP desta missão."}</p>
            </>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!done && (user
              ? <button type="button" onClick={finish} className="btn btn-lg btn-gold"><Icon name="bolt" fill /> Concluir missão</button>
              : <Link to="/entrar" className="btn btn-lg btn-gold">Entrar para ganhar XP</Link>)}
            {nextIndex !== null
              ? <Link to={`/mundo/${w.id}/${nextIndex}`} className={`btn btn-lg ${done ? "btn-world" : "btn-ghost"}`}>Próxima fase <Icon name="arrow-right" /></Link>
              : <Link to={`/mundo/${w.id}`} className={`btn btn-lg ${done ? "btn-world" : "btn-ghost"}`}>Voltar à trilha</Link>}
          </div>
        </section>

        {/* conversa sobre a missão — vai pro feed da comunidade com o tópico do mundo */}
        <section className="mt-14">
          <h2 className="display text-2xl font-black">O que você achou?</h2>
          <p className="mt-2 text-mist">Seu comentário aparece aqui e no feed de <Link to={`/comunidade?topico=${w.id}`} className="world-text font-bold underline underline-offset-4">#{w.name.split(" ")[0]}</Link>.</p>
          <div className="mt-5"><Composer fixedTopic={w.id} mission={{ world: w.id, index }} placeholder="Compartilhe o que aprendeu nesta missão" /></div>
          <div className="mt-4 space-y-3">
            {talk.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      </article>
    </div>
  );
}
