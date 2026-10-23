import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useSession } from "../lib/session";
import Icon from "./Icon";
import Avatar from "./Avatar";

const LETTERS = [["p", "#FF2D87"], ["l", "#FF4040"], ["u", "#2FCB5A"], ["r", "#FF8A1F"], ["a", "#2D9CFF"], ["l", "#A24BFF"]];

export function Wordmark({ className = "" }) {
  return (
    <span className={`display font-black ${className}`} aria-label="Plural">
      {LETTERS.map(([ch, c], i) => (
        <motion.span
          key={i} className="inline-block" style={{ color: c }}
          whileHover={{ y: -6, rotate: i % 2 ? 10 : -10, scale: 1.2 }}
          transition={{ type: "spring", stiffness: 500, damping: 12 }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

const LINKS = [
  { to: "/", label: "Início", icon: "home", end: true },
  { to: "/#mundos", label: "Mundos", icon: "compass" },
  { to: "/jogos", label: "Jogos", icon: "gamepad" },
  { to: "/ranking", label: "Ranking", icon: "trophy", desktop: true },
  { to: "/comunidade", label: "Comunidade", icon: "users" },
];

export default function Navbar() {
  const { user, level, progress } = useSession();
  const { pathname, hash } = useLocation();
  const isActive = (l) =>
    l.to === "/#mundos" ? pathname.startsWith("/mundo") || (pathname === "/" && hash === "#mundos")
    : l.end ? pathname === "/" && hash !== "#mundos"
    : pathname.startsWith(l.to);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-2xl border border-fg/10 bg-surface/75 pl-4 pr-2 shadow-[0_10px_40px_-14px_rgba(60,30,120,.25)] backdrop-blur-xl">
          <Link to="/" className="mr-3 flex items-center gap-1.5">
            <img src="/logo/logoplural.png" alt="" width={38} height={36} className="-my-2 h-10 w-auto" />
            <Wordmark className="text-xl" />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.to} to={l.to}
                className={`relative rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${isActive(l) ? "text-fg" : "text-mist hover:text-fg"}`}
              >
                {isActive(l) && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-fg/[.07]" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                <span className="relative">{l.label}</span>
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Link to="/perfil" className="flex items-center gap-3 rounded-xl py-1 pl-3 pr-1.5 transition-colors hover:bg-fg/5" aria-label={`Seu perfil — nível ${level.level}`}>
                {progress.streak > 1 && (
                  <span className="hidden items-center gap-1 text-sm font-extrabold text-[#FF8A1F] sm:flex">
                    <Icon name="flame" fill size={16} />{progress.streak}
                  </span>
                )}
                <span className="hidden w-28 sm:block">
                  <span className="flex justify-between text-[11px] font-extrabold">
                    <span className="text-gold">NÍVEL {level.level}</span>
                    <span className="text-mist">{level.into}/{level.need}</span>
                  </span>
                  <span className="xpbar mt-1 !h-2"><motion.i initial={false} animate={{ width: `${level.pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} style={{ transition: "none" }} /></span>
                </span>
                <Avatar mascot={user.mascot} size={34} />
              </Link>
            ) : (
              <>
                <Link to="/entrar" className="hidden rounded-xl px-3.5 py-2 text-sm font-bold text-mist hover:text-fg sm:block">Entrar</Link>
                <Link to="/entrar?modo=criar" className="btn btn-sm btn-gold">Criar conta</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Barra inferior no celular */}
      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-fg/10 bg-surface/90 p-1.5 backdrop-blur-xl md:hidden">
        {[...LINKS.filter((l) => !l.desktop), { to: user ? "/perfil" : "/entrar", label: user ? "Perfil" : "Entrar", icon: "user" }].map((l) => {
          const on = l.icon === "user" ? pathname === "/perfil" || pathname === "/entrar" : isActive(l);
          return (
            <Link key={l.label} to={l.to} className={`relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold ${on ? "text-fg" : "text-mist"}`}>
              {on && <motion.span layoutId="mnav-pill" className="absolute inset-0 rounded-xl bg-fg/[.07]" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <motion.span className="relative" whileTap={{ scale: 0.8 }}><Icon name={l.icon} size={20} /></motion.span>
              <span className="relative">{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
