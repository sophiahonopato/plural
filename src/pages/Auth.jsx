import { lazy, Suspense, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, useGSAP, reducedMotion } from "../lib/gsap";
import { WORLDS, bannerOf, worldById } from "../data/categories";
import { XP } from "../data/game";
import { useSession } from "../lib/session";
import { logIn, signUp } from "../lib/store";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";

const HeroScene = lazy(() => import("../components/HeroScene"));

export default function Auth() {
  const root = useRef(null);
  const navigate = useNavigate();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const creating = params.get("modo") === "criar";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [mascot, setMascot] = useState(WORLDS[0].id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const w = worldById(mascot);

  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.from(".auth-card", { y: 60, opacity: 0, rotationX: -12, transformPerspective: 900, duration: 0.9, ease: "power4.out" });
  }, { scope: root });

  // trocar de aba ou de personagem anima os campos e a arte
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.from(".auth-field", { y: 14, opacity: 0, duration: 0.35, stagger: 0.04, ease: "power2.out", clearProps: "all" });
  }, { scope: root, dependencies: [creating] });
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.fromTo(".auth-art", { scale: 1.12, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out" });
    if (creating) gsap.fromTo(".auth-pick[aria-checked=true]", { scale: 0.7 }, { scale: 1, duration: 0.5, ease: "elastic.out(1.1, 0.45)" });
  }, { scope: root, dependencies: [mascot, creating] });

  if (user && !busy) return <Navigate to="/perfil" replace />;

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setError(""); };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (creating) await signUp({ ...form, mascot });
      else await logIn(form);
      navigate(creating ? "/perfil" : "/comunidade", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
      if (!reducedMotion()) gsap.fromTo(".auth-card", { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
    }
  }

  return (
    <div ref={root} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-28 pt-24 md:pb-12" style={{ "--c": creating ? w.c : "#8B3DFF", "--deep": w.deep }}>
      <Suspense fallback={null}><HeroScene className="absolute inset-0 opacity-70" /></Suspense>

      <div className="auth-card relative z-10 grid w-full max-w-4xl overflow-hidden rounded-[32px] border border-fg/15 bg-surface/90 shadow-[0_40px_100px_-30px_rgba(60,30,120,.35)] backdrop-blur-xl md:grid-cols-[1fr_1.1fr]">
        {/* arte: muda com o personagem escolhido */}
        <div className="on-color relative hidden min-h-[560px] overflow-hidden md:block" style={{ background: `linear-gradient(180deg, ${creating ? w.c : "#8B3DFF"}, ${creating ? w.deep : "#3B0C82"})`, transition: "background .4s" }}>
          {creating ? (
            <>
              <div key={w.id} className="auth-art art absolute inset-0" style={{ "--img": `url(${bannerOf(w.id)})`, backgroundSize: "auto 62%", backgroundPosition: "center 30%" }} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-8 pt-20">
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-fg/75">Você joga com</p>
                <p className="display mt-1 text-4xl font-black">{w.mascot}</p>
                <p className="mt-2 text-fg/85">{w.desc}</p>
              </div>
            </>
          ) : (
            <div className="auth-art absolute inset-0 grid place-content-center gap-6 p-8 text-center">
              <div className="mx-auto grid grid-cols-3 gap-4">
                {WORLDS.map((x) => <Avatar key={x.id} mascot={x.id} size={76} className="floaty" ring={false} />)}
              </div>
              <p className="display text-3xl font-black">Que bom te ver de novo</p>
              <p className="text-fg/85">Sua sequência, seu XP e suas conquistas estão te esperando.</p>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="p-6 sm:p-9" noValidate>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-fg/5 p-1" role="tablist">
            {[["Entrar", false], ["Criar conta", true]].map(([label, mode]) => (
              <button
                key={label} type="button" role="tab" aria-selected={creating === mode}
                onClick={() => { setParams(mode ? { modo: "criar" } : {}, { replace: true }); setError(""); }}
                className={`relative rounded-xl py-2.5 text-sm font-extrabold transition-colors ${creating === mode ? "text-surface" : "text-mist hover:text-fg"}`}
              >
                {creating === mode && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-fg" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          <h1 className="auth-field display mt-7 text-2xl font-black sm:text-3xl">{creating ? "Crie seu jogador" : "Entrar no Plural"}</h1>
          <p className="auth-field mt-2 text-mist">
            {creating ? <>Leva um minuto e você já começa com <b className="text-gold">+{XP.signup} XP</b>.</> : "Use o e-mail e a senha da sua conta."}
          </p>

          <div className="mt-6 space-y-4">
            {creating && (
              <label className="auth-field block">
                <span className="mb-1.5 block text-sm font-bold">Nome</span>
                <input className="input" value={form.name} onChange={set("name")} autoComplete="name" maxLength={30} placeholder="Como você quer aparecer" required />
              </label>
            )}
            <label className="auth-field block">
              <span className="mb-1.5 block text-sm font-bold">E-mail</span>
              <input className="input" type="email" value={form.email} onChange={set("email")} autoComplete="email" placeholder="voce@email.com" required />
            </label>
            <label className="auth-field block">
              <span className="mb-1.5 block text-sm font-bold">Senha</span>
              <input className="input" type="password" value={form.password} onChange={set("password")} autoComplete={creating ? "new-password" : "current-password"} placeholder={creating ? "Pelo menos 6 caracteres" : "Sua senha"} required />
            </label>

            {creating && (
              <fieldset className="auth-field">
                <legend className="mb-2 text-sm font-bold">Escolha seu personagem</legend>
                <div className="grid grid-cols-6 gap-2" role="radiogroup">
                  {WORLDS.map((x) => (
                    <button
                      key={x.id} type="button" role="radio" aria-checked={x.id === mascot} aria-label={`${x.mascot} — ${x.name}`} title={`${x.mascot} — ${x.name}`}
                      onClick={() => setMascot(x.id)}
                      className={`auth-pick rounded-full transition-[opacity,filter] ${x.id === mascot ? "" : "opacity-45 grayscale-[.4] hover:opacity-90 hover:grayscale-0"}`}
                    >
                      <motion.span className="block" whileHover={{ y: -4, rotate: -6 }} whileTap={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 500, damping: 14 }}>
                        <Avatar mascot={x.id} size={52} ring={x.id === mascot} className="!h-auto !w-full aspect-square" />
                      </motion.span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-mist">Dá pra trocar depois no seu perfil.</p>
              </fieldset>
            )}
          </div>

          <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, height: 0, y: -6 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} role="alert" className="mt-4 flex items-center gap-2 overflow-hidden rounded-2xl border border-[#FF4040]/40 bg-[#FF4040]/10 px-4 py-3 text-sm font-bold text-[#C81E1E]">
              <Icon name="x" size={16} strokeWidth={3} /> {error}
            </motion.p>
          )}
          </AnimatePresence>

          <button type="submit" disabled={busy} className={`btn btn-lg mt-6 w-full ${creating ? "btn-world" : "btn-primary"}`}>
            {busy ? "Só um instante…" : creating ? `Começar como ${w.mascot}` : "Entrar"} <Icon name="arrow-right" />
          </button>
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-mist/80">
            <Icon name="lock" size={14} className="mt-0.5" />
            Sua conta fica salva neste navegador. A senha é guardada só em forma de hash.
          </p>
        </form>
      </div>
    </div>
  );
}
