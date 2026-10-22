import { useState } from "react";
import { worldById } from "../data/categories";
import { useSession, timeAgo } from "../lib/session";
import { Navigate } from "react-router-dom";
import { authorOf, deletePost, deleteUser, isAdmin, progressOf } from "../lib/store";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";

export default function Admin() {
  const { state, user } = useSession();
  const [tab, setTab] = useState("posts");

  // Só a conta de moderação vê o painel; qualquer outra pessoa volta pro início.
  if (!isAdmin(user)) return <Navigate to="/" replace />;

  const posts = [...state.posts].sort((a, b) => b.ts - a.ts);
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-3xl font-black">Moderação</h1>
      </div>

      <div className="mt-6 inline-grid grid-cols-2 gap-1 rounded-2xl bg-fg/5 p-1" role="tablist">
        {[["posts", `Posts (${posts.length})`], ["users", `Contas (${state.users.length})`]].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-xl px-5 py-2 text-sm font-extrabold ${tab === id ? "bg-fg text-surface" : "text-mist"}`}>{label}</button>
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {tab === "posts" && posts.map((p) => {
          const a = authorOf(state, p.userId);
          return (
            <li key={p.id} className="panel flex items-start gap-3 p-4">
              <Avatar mascot={a.mascot} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-mist"><b className="text-fg">{a.name}</b> @{a.handle} · {timeAgo(p.ts)} · #{worldById(p.topic).name.split(" ")[0]}{p.replyTo ? " · resposta" : ""}</p>
                <p className="mt-1 whitespace-pre-wrap break-words">{p.text}</p>
              </div>
              <button type="button" className="btn btn-sm btn-ghost !text-[#C81E1E]" onClick={() => window.confirm("Apagar este post?") && deletePost(p.id, { asAdmin: true })}><Icon name="trash" size={15} /> Apagar</button>
            </li>
          );
        })}
        {tab === "users" && state.users.map((u) => (
          <li key={u.id} className="panel flex items-center gap-3 p-4">
            <Avatar mascot={u.mascot} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{u.name} <span className="font-medium text-mist">@{u.handle}</span></p>
              <p className="truncate text-sm text-mist">{u.email} · {progressOf(state, u.id).xp} XP</p>
            </div>
            <button type="button" className="btn btn-sm btn-ghost !text-[#C81E1E]" onClick={() => window.confirm(`Remover a conta de ${u.name} e todos os posts dela?`) && deleteUser(u.id)}><Icon name="trash" size={15} /> Remover</button>
          </li>
        ))}
        {((tab === "posts" && posts.length === 0) || (tab === "users" && state.users.length === 0)) && <li className="panel p-8 text-center text-mist">Nada por aqui.</li>}
      </ul>
    </div>
  );
}
