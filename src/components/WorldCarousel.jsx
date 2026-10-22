import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap, Draggable, useGSAP } from "../lib/gsap";
import { WORLDS, bannerOf } from "../data/categories";
import { BLOGS } from "../data/blogs";
import { readIn } from "../data/game";
import { useSession } from "../lib/session";
import Icon from "./Icon";
import Avatar from "./Avatar";

const N = WORLDS.length;
const STEP = 360 / N;
const DEG_PER_PX = 0.3;

// Tela de "seleção de personagem": as 6 cartas formam um anel 3D que gira
// arrastando, pelas setas ou clicando numa carta lateral.
export default function WorldCarousel() {
  const root = useRef(null);
  const api = useRef({ go: () => {} });
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { progress } = useSession();
  const w = WORLDS[active];
  const done = progress ? readIn(progress, w.id) : 0;
  const total = BLOGS[w.id].length;

  useGSAP(() => {
    const stage = root.current.querySelector(".wc-stage");
    const ring = root.current.querySelector(".wc-ring");
    const cards = gsap.utils.toArray(".wc-card", ring);
    const st = { rot: 0 };
    let radius = 0;
    let current = 0;

    function render() {
      ring.style.transform = `translateZ(${-radius}px) rotateY(${st.rot}deg)`;
      cards.forEach((card, i) => {
        const a = (((i * STEP + st.rot) % 360) + 540) % 360 - 180; // ângulo em relação à frente
        const facing = Math.max(0, Math.cos((a * Math.PI) / 180));
        card.style.filter = `brightness(${0.7 + 0.3 * facing}) saturate(${0.5 + 0.5 * facing})`;
        card.style.opacity = String(0.35 + 0.65 * facing);
      });
      const idx = ((Math.round(-st.rot / STEP) % N) + N) % N;
      if (idx !== current) { current = idx; setActive(idx); }
    }

    function measure() {
      radius = parseFloat(getComputedStyle(stage).getPropertyValue("--r"));
      render();
    }
    measure();
    window.addEventListener("resize", measure);

    const spin = (rot) => gsap.to(st, { rot, duration: 0.9, ease: "power3.out", overwrite: true, onUpdate: render });
    const go = (idx) => {
      const delta = (((-idx * STEP - st.rot) % 360) + 540) % 360 - 180; // caminho mais curto
      spin(st.rot + delta);
    };
    api.current.go = (dir) => spin(Math.round(st.rot / STEP) * STEP - dir * STEP);

    let startRot = 0;
    let startX = 0;
    const toRot = (x) => startRot + (x - startX) * DEG_PER_PX;
    const [drag] = Draggable.create(document.createElement("div"), {
      trigger: stage,
      type: "x",
      inertia: true,
      onPress() { gsap.killTweensOf(st); startRot = st.rot; startX = this.x; },
      onDrag() { st.rot = toRot(this.x); render(); },
      onThrowUpdate() { st.rot = toRot(this.x); render(); },
      snap: { x: (x) => startX + (Math.round(toRot(x) / STEP) * STEP - startRot) / DEG_PER_PX },
      onClick(e) {
        const card = e.target.closest?.(".wc-card");
        if (!card) return;
        const idx = Number(card.dataset.idx);
        if (idx === current) navigate(`/mundo/${WORLDS[idx].id}`);
        else go(idx);
      },
    });

    // entrada: o anel dá uma volta e assenta
    gsap.from(st, {
      rot: -200, duration: 1.8, ease: "power3.out", onUpdate: render,
      scrollTrigger: { trigger: stage, start: "top 80%", once: true },
    });
    render();

    return () => {
      window.removeEventListener("resize", measure);
      drag.kill();
    };
  }, { scope: root });

  // troca de mundo: o painel de detalhes "pisca" pro novo conteúdo
  useGSAP(() => {
    gsap.fromTo(".wc-detail > *", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out", overwrite: true });
  }, { scope: root, dependencies: [active] });

  return (
    <div ref={root} className="grid items-center gap-8 lg:grid-cols-[1.25fr_1fr]" style={{ "--c": w.c }}>
      <div className="relative">
        <div
          className="wc-stage relative h-[400px] [--h:300px] [--r:215px] [--w:210px] sm:h-[480px] sm:[--h:370px] sm:[--r:300px] sm:[--w:260px]"
          role="group" aria-label="Escolha um mundo"
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl transition-colors duration-500" style={{ background: w.c }} />
          <div className="wc-ring">
            {WORLDS.map((x, i) => (
              <div key={x.id} data-idx={i} className="wc-card on-color" style={{ "--i": i, "--c": x.c, "--deep": x.deep }}>
                <div className="art absolute inset-x-0 top-0 h-[80%]" style={{ "--img": `url(${bannerOf(x.id)})`, WebkitMaskImage: "linear-gradient(#000 78%, transparent)", maskImage: "linear-gradient(#000 78%, transparent)" }} />
                <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-fg/75">{x.mascot}</p>
                  <p className="display mt-1 text-lg font-black leading-tight text-fg sm:text-xl">{x.name.split(" ")[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4">
          <button type="button" className="btn btn-sm btn-ghost !px-3" onClick={() => api.current.go(-1)} aria-label="Mundo anterior"><Icon name="chevron-left" /></button>
          <span className="text-xs font-bold text-mist">arraste para girar</span>
          <button type="button" className="btn btn-sm btn-ghost !px-3" onClick={() => api.current.go(1)} aria-label="Próximo mundo"><Icon name="chevron-right" /></button>
        </div>
      </div>

      <div className="wc-detail panel p-6 sm:p-8" aria-live="polite">
        <div className="flex items-center gap-4">
          <Avatar mascot={w.id} size={68} />
          <div>
            <p className="kicker world-text">Guia: {w.mascot}</p>
            <h3 className="display mt-1 text-2xl font-black sm:text-3xl">{w.name}</h3>
          </div>
        </div>
        <p className="mt-5 text-lg leading-relaxed text-mist">{w.desc}</p>
        <div className="mt-6">
          <div className="flex justify-between text-xs font-extrabold uppercase tracking-wider">
            <span className="text-mist">Missões concluídas</span>
            <span>{done}/{total}</span>
          </div>
          <div className="xpbar mt-2"><i style={{ width: `${(done / total) * 100}%`, background: w.c, boxShadow: `0 0 14px ${w.c}` }} /></div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to={`/mundo/${w.id}`} className="btn btn-world">Entrar no mundo <Icon name="arrow-right" /></Link>
          <Link to={`/comunidade?topico=${w.id}`} className="btn btn-ghost"><Icon name="message" /> Ver o papo</Link>
        </div>
      </div>
    </div>
  );
}
