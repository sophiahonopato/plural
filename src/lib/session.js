import { useStore, currentUser, progressOf } from "./store";
import { levelInfo } from "../data/game";

// Tudo o que as telas precisam saber sobre quem está logado.
export function useSession() {
  const state = useStore();
  const user = currentUser(state);
  const progress = user ? progressOf(state, user.id) : null;
  return { state, user, progress, level: progress ? levelInfo(progress.xp) : null };
}

export function timeAgo(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
