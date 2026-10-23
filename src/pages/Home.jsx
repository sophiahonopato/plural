import { lazy, Suspense, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { gsap, ScrollTrigger, SplitText, useGSAP, reducedMotion } from "../lib/gsap";
import { WORLDS, wideOf } from "../data/categories";
import { BLOGS } from "../data/blogs";
import { BADGES, TOTAL_MISSIONS, XP } from "../data/game";
import { useSession } from "../lib/session";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import Tilt from "../components/Tilt";
import WorldCarousel from "../components/WorldCarousel";
import { PostCard } from "../components/Post";
import Magnetic from "../components/Magnetic";

const HeroScene = lazy(() => import("../components/HeroScene"));

const STEPS = [
  { icon: "book", c: "#2D9CFF", title: "Complete missões", text: "Cada artigo é uma missão. Leia até o fim, marque como concluída e leve o XP pra casa.", xp: `+${XP.read} XP` },
  { icon: "send", c: "#FF2D87", title: "Solte a voz", text: "Publique na comunidade sobre o tópico que quiser, responda e curta o que a galera escreveu.", xp: `+${XP.post} XP` },
  { icon: "trophy", c: "#FFD23F", title: "Suba de nível", text: "Mantenha a sequência diária, desbloqueie conquistas e vire mestre de cada mundo.", xp: `${BADGES.length} conquistas` },
];

// uma missão em destaque por mundo + a segunda de cada, intercaladas
const FEATURED = [0, 1].flatMap((index) => WORLDS.map((w) => ({ w, index, blog: BLOGS[w.id][index] })));

export default function Home() {
  const root = useRef(null);
  const track = useRef(null);
  const { state, user } = useSession();
  const slide = (dir) => {
    const el = track.current;
    const card = el.querySelector("a");
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: reducedMotion() ? "auto" : "smooth" });
  };
  const recent = state.posts.filter((p) => !p.replyTo).slice(0, 3);

  // Missões em destaque: no desktop a seção fixa e o scroll vira horizontal.
  // Fica antes dos outros hooks porque o pin precisa existir antes dos gatilhos abaixo dele.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const track = root.current.querySelector(".h-track");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: ".h-section", start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    });
  }, { scope: root });

  useGSAP(() => {
    const still = reducedMotion();

    // ---------- HERO ----------
    if (!still) {
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      SplitText.create(".hero-line", {
        type: "words,chars",
        onSplit(self) {
          // "comunidade." ganha uma cor de mundo por letra
          self.chars
            .filter((c) => c.closest(".hero-colors"))
            .slice(3)
            .forEach((c, i) => { c.style.color = WORLDS[i % WORLDS.length].c; });
          return gsap.from(self.chars, { yPercent: 90, rotationX: -80, opacity: 0, transformOrigin: "50% 100%", transformPerspective: 600, duration: 0.9, stagger: 0.022, ease: "back.out(1.6)" });
        },
      });
      intro
        .from(".hero-kicker", { y: -20, opacity: 0, duration: 0.6 }, 0.1)
        .from(".hero-sub", { y: 24, opacity: 0, duration: 0.8 }, 0.7)
        .from(".hero-cta > *", { y: 24, opacity: 0, scale: 0.9, duration: 0.6, stagger: 0.08, ease: "back.out(2)" }, 0.85)
        .from(".hero-art", { y: 120, opacity: 0, scale: 0.86, rotationX: 28, duration: 1.3, ease: "expo.out" }, 0.5)
        .from(".hero-hud > *", { y: 20, opacity: 0, duration: 0.5, stagger: 0.07 }, 1.2);

      // arte: inclina com o ponteiro e afunda no scroll
      const art = root.current.querySelector(".hero-art-inner");
      const rx = gsap.quickTo(art, "rotationX", { duration: 0.7, ease: "power3.out" });
      const ry = gsap.quickTo(art, "rotationY", { duration: 0.7, ease: "power3.out" });
      const onMove = (e) => {
        ry((e.clientX / window.innerWidth - 0.5) * 12);
        rx((0.5 - e.clientY / window.innerHeight) * 8);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      gsap.to(".hero-art", { yPercent: 18, scale: 0.92, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-copy", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "60% top", scrub: true } });

      // ---------- LETREIRO: corre sozinho, acelera e inclina com o scroll ----------
      const marquee = gsap.to(".marquee", { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
      const skew = gsap.quickTo(".marquee", "skewX", { duration: 0.4, ease: "power3.out" });
      let rest;
      ScrollTrigger.create({
        onUpdate(self) {
          const v = gsap.utils.clamp(-1, 1, self.getVelocity() / 2500);
          skew(v * -12);
          marquee.timeScale(1 + Math.abs(v) * 5);
          rest?.kill();
          rest = gsap.delayedCall(0.12, () => {
            skew(0);
            gsap.to(marquee, { timeScale: 1, duration: 1, overwrite: true });
          });
        },
      });

      // ---------- REVELAÇÕES ----------
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%" } });
      });
      gsap.from(".step", {
        y: 70, opacity: 0, rotationX: -25, transformOrigin: "50% 0%", duration: 0.9, stagger: 0.12, ease: "back.out(1.4)",
        scrollTrigger: { trigger: ".steps", start: "top 80%" },
      });
      gsap.from(".badge-pop", {
        scale: 0, rotation: -40, duration: 0.6, stagger: 0.05, ease: "back.out(2.2)",
        scrollTrigger: { trigger: ".badges", start: "top 85%" },
      });
      gsap.to(".orbit", { rotation: 360, duration: 40, ease: "none", repeat: -1 });
      gsap.to(".orbit-item", { rotation: -360, duration: 40, ease: "none", repeat: -1 });

      return () => window.removeEventListener("pointermove", onMove);
    }
  }, { scope: root });

  // HUD de demonstração: a barra de XP enche e o nível sobe quando entra na tela
  useGSAP(() => {
    const demo = { xp: 0 };
    const bar = root.current.querySelector(".demo-bar");
    const num = root.current.querySelector(".demo-xp");
    const lvl = root.current.querySelector(".demo-lvl");
    const paint = () => {
      const level = 1 + Math.floor(demo.xp / 100);
      bar.style.width = `${demo.xp % 100}%`;
      num.textContent = Math.round(demo.xp);
      if (lvl.textContent !== String(level)) {
        lvl.textContent = level;
        gsap.fromTo(lvl, { scale: 1.8 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      }
    };
    if (reducedMotion()) { demo.xp = 265; paint(); return; }
    gsap.to(demo, { xp: 265, duration: 3.2, ease: "power1.inOut", onUpdate: paint, scrollTrigger: { trigger: ".demo-hud", start: "top 80%" } });
  }, { scope: root });

  return (
    <div ref={root}>
      {/* ================= HERO ================= */}
      <section className="hero relative flex min-h-[100svh] flex-col items-center overflow-hidden px-5 pb-10 pt-28 sm:pt-32">
        <Suspense fallback={null}><HeroScene className="absolute inset-0 opacity-60 sm:opacity-100" /></Suspense>

        <div className="hero-copy relative z-10 mx-auto max-w-5xl text-center">
          <p className="hero-kicker chip chip-gold !px-4 !py-1.5">
            <Icon name="sparkles" fill size={14} /> Temporada 1 · {WORLDS.length} mundos · {TOTAL_MISSIONS} missões
          </p>
          <h1 className="display mt-6 text-[clamp(2.1rem,6.2vw,4.9rem)] font-black">
            <span className="hero-line block">Seis mundos.</span>
            <span className="hero-line hero-colors block">Uma comunidade.</span>
          </h1>
          <p className="hero-sub mx-auto mt-6 max-w-xl text-lg leading-relaxed text-mist sm:text-xl">
            Escolha seu personagem, complete missões de leitura, ganhe XP e fale sobre o que te move.
          </p>
          <div className="hero-cta mt-8 flex flex-wrap justify-center gap-4">
            <Magnetic>
              <Link to={user ? "/comunidade" : "/entrar?modo=criar"} className="btn btn-lg btn-gold">
                <Icon name="bolt" fill /> {user ? "Ir pra comunidade" : "Começar a jogar"}
              </Link>
            </Magnetic>
            <Magnetic>
              <Link to="/#mundos" className="btn btn-lg btn-ghost">Explorar mundos <Icon name="arrow-right" /></Link>
            </Magnetic>
          </div>
        </div>

        <div className="hero-art relative z-10 mt-auto w-full max-w-4xl pt-10 [perspective:1200px]">
          <div className="hero-art-inner relative">
            <div className="absolute inset-x-[12%] bottom-[-6%] h-[18%] rounded-[100%] bg-[#3B1A7A]/25 blur-2xl" />
            <img
              src="/banners/hero.webp" width={1033} height={312} draggable={false}
              alt="Os seis mascotes do Plural — raposa, coruja, coala, leão, golfinho e polvo — apoiados nas letras da palavra plural"
              className="relative w-full drop-shadow-[0_24px_30px_rgba(60,30,120,.28)]"
            />
          </div>
        </div>

        <div className="hero-hud relative z-10 mt-6 flex flex-wrap justify-center gap-2 text-sm font-bold text-mist">
          {WORLDS.map((w) => (
            <Link key={w.id} to={`/mundo/${w.id}`} className="chip chip-world transition-transform hover:-translate-y-0.5" style={{ "--c": w.c, background: `color-mix(in srgb, ${w.c} 12%, #fff)` }}>
              {w.name.split(" ")[0]}
            </Link>
          ))}
        </div>
      </section>

      {/* ================= LETREIRO ================= */}
      <div className="on-color relative -mx-2 -rotate-1 overflow-hidden bg-ink-900 py-4" aria-hidden="true">
        <div className="marquee">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 items-center">
              {WORLDS.map((w) => (
                <span key={w.id} className="display flex items-center gap-6 px-6 text-2xl font-black uppercase sm:text-4xl" style={{ color: w.c }}>
                  {w.name}
                  <Icon name="sparkles" fill size={22} className="text-fg/30" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ================= SELEÇÃO DE MUNDO ================= */}
      <section id="mundos" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-24">
        <div className="reveal max-w-2xl">
          <p className="kicker"><Icon name="compass" size={14} /> Seleção de mundo</p>
          <h2 className="display mt-3 text-4xl font-black sm:text-5xl">Escolha por onde começar</h2>
          <p className="mt-4 text-lg text-mist">Cada mundo tem um mascote como guia e cinco missões esperando por você.</p>
        </div>
        <div className="mt-8"><WorldCarousel /></div>
      </section>

      {/* ================= COMO FUNCIONA ================= */}
      <MascotParade />

      <section className="mx-auto max-w-6xl px-5 pt-28">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="kicker justify-center"><Icon name="target" size={14} /> Como o jogo funciona</p>
          <h2 className="display mt-3 text-4xl font-black sm:text-5xl">Aprender aqui dá XP</h2>
        </div>

        <div className="steps mt-12 grid gap-5 [perspective:1200px] md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Tilt key={s.title} className="step panel p-7" style={{ "--c": s.c }}>
              <span className="display absolute right-6 top-4 text-6xl font-black text-fg/[.06]">{i + 1}</span>
              <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${s.c}22`, color: s.c, boxShadow: `inset 0 0 0 2px ${s.c}55` }}>
                <Icon name={s.icon} size={26} />
              </span>
              <h3 className="display mt-6 text-xl font-bold">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-mist">{s.text}</p>
              <span className="chip chip-world mt-5">{s.xp}</span>
            </Tilt>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <div className="demo-hud reveal panel p-7">
            <p className="kicker">Seu progresso</p>
            <div className="mt-5 flex items-center gap-5">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-b from-[#FFE27A] to-[#FFB800] shadow-[0_6px_0_#a86f00]">
                <span className="demo-lvl display text-4xl font-black text-[#3A2500]">1</span>
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <b className="display text-lg">Nível</b>
                  <span className="font-bold text-gold"><span className="demo-xp tabular-nums">0</span> XP</span>
                </div>
                <div className="xpbar mt-3 !h-4"><i className="demo-bar !transition-none" style={{ width: 0 }} /></div>
              </div>
            </div>
            <p className="mt-6 leading-relaxed text-mist">Tudo o que você faz no Plural enche a barra. Subiu de nível? Tem festa na tela.</p>
          </div>

          <div className="badges reveal panel p-7">
            <p className="kicker"><Icon name="trophy" size={14} /> Conquistas pra desbloquear</p>
            <div className="mt-5 grid grid-cols-5 gap-3 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-8">
              {BADGES.map((b) => (
                <span
                  key={b.id} title={`${b.name} — ${b.desc}`}
                  className="badge-pop grid aspect-square place-items-center overflow-hidden rounded-2xl"
                  style={{ background: `${b.c}22`, color: b.c, boxShadow: `inset 0 0 0 2px ${b.c}66` }}
                >
                  {b.world ? <Avatar mascot={b.world} size={64} ring={false} className="!h-full !w-full" /> : <Icon name={b.icon} fill size={24} />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MISSÕES EM DESTAQUE (scroll horizontal) ================= */}
      <section className="h-section mt-28 overflow-hidden lg:flex lg:h-screen lg:flex-col lg:justify-center">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-5">
          <div>
            <p className="kicker"><Icon name="bolt" fill size={14} /> Missões em destaque</p>
            <h2 className="display mt-3 text-[2rem] font-black leading-tight sm:text-5xl">Por onde a galera começa</h2>
          </div>
          {/* abaixo de lg o trilho é rolagem nativa: setas pra quem não desliza */}
          <div className="flex gap-2 lg:hidden">
            <button type="button" aria-label="Missões anteriores" className="btn btn-sm btn-ghost !px-3" onClick={() => slide(-1)}><Icon name="chevron-left" /></button>
            <button type="button" aria-label="Próximas missões" className="btn btn-sm btn-ghost !px-3" onClick={() => slide(1)}><Icon name="chevron-right" /></button>
          </div>
        </div>
        <div
          ref={track}
          className="h-track no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-10 pt-2 sm:gap-5 lg:mt-10 lg:w-max lg:snap-none lg:overflow-visible lg:pb-6 lg:pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] lg:pr-[20vw]"
        >
          {FEATURED.map(({ w, index, blog }) => (
            <Link key={`${w.id}-${index}`} to={`/mundo/${w.id}/${index}`} className="group block w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-[300px] lg:w-[340px] lg:max-w-none" style={{ "--c": w.c, "--deep": w.deep }}>
              <Tilt max={8} className="h-full overflow-hidden rounded-[28px] border-2 border-fg/10 bg-surface shadow-[0_20px_50px_-25px_rgba(60,30,120,.35)] transition-colors group-hover:border-[color:var(--c)]">
                <div className="art h-36 transition-transform duration-500 group-hover:scale-105 sm:h-44" style={{ "--img": `url(${wideOf(w.id)})`, backgroundColor: w.c, backgroundSize: "cover", backgroundPosition: "center 40%" }} />
                <div className="relative p-5 sm:p-6">
                  <span className="chip chip-world">{w.name.split(" ")[0]}</span>
                  <h3 className="display mt-3 line-clamp-3 min-h-[3.9em] text-base font-bold leading-snug sm:mt-4 sm:text-lg">{blog.title}</h3>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm font-bold sm:mt-5">
                    <span className="flex items-center gap-1.5 text-mist"><Icon name="clock" size={15} /> {blog.readTime}</span>
                    <span className="chip chip-gold"><Icon name="bolt" fill size={12} /> +{XP.read} XP</span>
                  </div>
                </div>
              </Tilt>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= ARCADE ================= */}
      <section className="mx-auto max-w-6xl px-5 pt-24">
        <motion.div
          initial={{ y: 60, opacity: 0, rotateX: 18 }} whileInView={{ y: 0, opacity: 1, rotateX: 0 }} viewport={{ once: true, margin: "-15%" }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }} style={{ transformPerspective: 1200 }}
          className="on-color relative overflow-hidden rounded-[36px] border-[3px] border-white bg-gradient-to-br from-[#FF8A1F] via-[#FF2D87] to-[#8B3DFF] p-8 shadow-[0_40px_80px_-40px_rgba(139,61,255,.8)] sm:p-12"
        >
          {["gamepad", "star", "bolt", "help", "trophy"].map((ic, k) => (
            <motion.span
              key={ic} aria-hidden="true" className="absolute hidden h-16 w-16 place-items-center rounded-2xl bg-white/20 sm:grid"
              style={{ right: `${6 + (k % 3) * 13}%`, top: `${12 + Math.floor(k / 3) * 46 + (k % 2) * 12}%` }}
              animate={{ y: [0, -14, 0], rotate: [k * 7 - 14, k * 7 - 6, k * 7 - 14] }} transition={{ duration: 3 + k * 0.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon name={ic} size={30} fill={ic === "star" || ic === "bolt"} />
            </motion.span>
          ))}
          <div className="relative max-w-lg">
            <p className="kicker"><Icon name="gamepad" size={14} /> Novo: Arcade</p>
            <h2 className="display mt-3 text-4xl font-black sm:text-5xl">Jogue, acerte e suba de nível</h2>
            <p className="mt-4 text-lg text-fg/90">Quiz em cada mundo, jogo da memória com os mascotes, Pega-XP e Verdade ou Mito. Tudo valendo XP.</p>
            <Magnetic className="mt-8">
              <Link to="/jogos" className="btn btn-lg btn-gold"><Icon name="gamepad" /> Abrir o Arcade</Link>
            </Magnetic>
          </div>
        </motion.div>
      </section>

      {/* ================= COMUNIDADE ================= */}
      <section className="teaser mx-auto grid max-w-6xl items-center gap-12 px-5 pt-28 lg:grid-cols-2 lg:pt-6">
        <div className="reveal">
          <p className="kicker"><Icon name="users" size={14} /> Comunidade</p>
          <h2 className="display mt-3 text-4xl font-black sm:text-5xl">Cada tópico, <span className="text-[#FF2D87]">a sua voz</span></h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-mist">
            Um feed aberto onde cada pessoa escreve sobre o tópico que quiser: tecnologia, política, comida, esporte,
            estudos ou saúde mental. Curta, responda e salve o que fizer sentido.
          </p>
          <Link to="/comunidade" className="btn btn-lg btn-primary mt-8">Abrir a comunidade <Icon name="arrow-right" /></Link>
        </div>
        <div className="space-y-4">
          {recent.map((p, i) => (
            <motion.div
              key={p.id} className="teaser-post" style={{ marginLeft: `${i * 5}%`, marginRight: `${(2 - i) * 5}%`, transformPerspective: 1000 }}
              initial={{ opacity: 0, x: 90, rotateY: -35, rotateZ: 4 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0, rotateZ: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.12 }}
            >
              <PostCard post={p} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= CHAMADA FINAL ================= */}
      <section className="reveal relative mx-auto mt-28 max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-[36px] border border-fg/15 bg-gradient-to-br from-brand-600 via-[#5B16B8] to-[#2A0B5C] px-6 on-color py-16 text-center sm:py-20">
          <div className="orbit pointer-events-none absolute left-1/2 top-1/2 -ml-[430px] -mt-[430px] hidden h-[860px] w-[860px] rounded-full border border-dashed border-fg/20 md:block">
            {WORLDS.map((w, i) => (
              <span key={w.id} className="absolute left-1/2 top-1/2 -ml-8 -mt-8" style={{ transform: `rotate(${i * 60}deg) translateY(-430px) rotate(${-i * 60}deg)` }}>
                <span className="orbit-item block"><Avatar mascot={w.id} size={64} /></span>
              </span>
            ))}
          </div>
          <div className="relative">
            <h2 className="display mx-auto max-w-2xl text-4xl font-black sm:text-6xl">Pronto pra entrar no jogo?</h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-fg/75">Crie sua conta, escolha um mascote e ganhe seus primeiros {XP.signup} XP agora.</p>
            <Link to={user ? "/perfil" : "/entrar?modo=criar"} className="btn btn-lg btn-gold mt-8">
              {user ? "Ver meu perfil" : "Criar minha conta"} <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Desfile 3D: os seis mascotes giram num cilindro conforme o scroll (Framer Motion).
function MascotParade() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const rotate = useTransform(p, [0, 1], [-140, 140]);
  const tilt = useTransform(p, [0, 0.5, 1], [22, 0, -22]);
  const scale = useTransform(p, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <section ref={ref} className="relative mx-auto mt-24 max-w-6xl px-5" aria-label="Os mascotes do Plural">
      <div className="relative h-[340px] sm:h-[400px]" style={{ perspective: 1100 }}>
        <motion.div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ rotateY: rotate, rotateX: tilt, scale, transformStyle: "preserve-3d" }}>
          {WORLDS.map((w, i) => (
            <div
              key={w.id}
              className="absolute -ml-[90px] -mt-[110px] h-[220px] w-[180px]"
              style={{ transform: `rotateY(${i * 60}deg) translateZ(clamp(190px, 30vw, 330px))`, transformStyle: "preserve-3d" }}
            >
              <Link
                to={`/mundo/${w.id}`}
                className="on-color group flex h-full w-full flex-col items-center justify-end overflow-hidden rounded-[28px] border-[3px] border-white p-4 text-center shadow-[0_30px_50px_-25px_rgba(60,30,120,.55)] transition-transform hover:scale-105"
                style={{ background: `linear-gradient(180deg, ${w.c}, ${w.deep})`, backfaceVisibility: "hidden" }}
              >
                <img src={`/avatars/${w.id}.webp`} alt="" width={120} height={120} className="mb-auto mt-2 h-28 w-28 rounded-full border-4 border-white/70 object-cover transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
                <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-fg/80">{w.mascot}</span>
                <span className="display mt-1 text-base font-black">{w.name.split(" ")[0]}</span>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
