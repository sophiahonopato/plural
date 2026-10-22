import { Link } from "react-router-dom";
import { WORLDS } from "../data/categories";
import { Wordmark } from "./Navbar";

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-fg/10 bg-surface/60 pb-28 pt-14 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1.4fr_1fr_1fr]">
        <div id="sobre">
          <Wordmark className="text-3xl" />
          <p className="mt-4 max-w-sm leading-relaxed text-mist">
            Um espaço para pessoas curiosas, criativas e apaixonadas por aprender. Aqui, diferentes interesses se
            conectam para formar algo maior: uma comunidade verdadeiramente plural.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-[.2em] text-fg/50">Mundos</h3>
          <ul className="mt-4 space-y-2.5">
            {WORLDS.map((w) => (
              <li key={w.id}>
                <Link to={`/mundo/${w.id}`} className="inline-flex items-center gap-2.5 font-bold text-mist transition-colors hover:text-fg">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: w.c }} />{w.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-[.2em] text-fg/50">Contato</h3>
          <p className="mt-4 leading-relaxed text-mist">
            Quer sugerir um tema, relatar um problema ou só dizer oi? Escreva pra gente pela{" "}
            <Link to="/comunidade" className="font-bold text-fg underline decoration-brand decoration-2 underline-offset-4">comunidade</Link>.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-sm text-fg/40">
        <span>© {new Date().getFullYear()} Plural</span>
      </div>
    </footer>
  );
}
