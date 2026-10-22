// ------------------------------------------------------------------
// STORE — contas, sessão, posts e progresso do jogo.
//
// Tudo fica no localStorage do navegador, então o site funciona sem
// servidor. Isso também significa que cada navegador tem a própria
// "comunidade". Pra virar multiusuário de verdade, troque `load` e
// `commit` por chamadas a um backend (Supabase, Firebase, API própria)
// — o resto do app só conversa com as funções exportadas daqui.
// ------------------------------------------------------------------
import { useSyncExternalStore } from "react";
import { WORLDS, worldById } from "../data/categories";
import { BADGES, DAILY, DAILY_CAPS, GAME_CAP, XP, levelInfo, missionKey } from "../data/game";

const KEY = "plural:v2";
export const MAX_POST = 280;
// Contas com acesso ao painel de moderação (pelo e-mail do login).
// Enquanto o site não tiver servidor, essa checagem roda no navegador e serve
// pra esconder o painel, não como segurança de verdade.
export const ADMIN_EMAILS = ["sophiahonoratodev@gmail.com"];
export const isAdmin = (user) => !!user && ADMIN_EMAILS.includes(user.email);

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const dayOf = (d) => d.toLocaleDateString("sv"); // AAAA-MM-DD no fuso local
const today = () => dayOf(new Date());
const yesterday = () => dayOf(new Date(Date.now() - 864e5));

function seedPosts() {
  const now = Date.now();
  return WORLDS.map((w, i) => ({
    id: `seed-${w.id}`, userId: `mascote:${w.id}`, topic: w.id, text: w.welcome,
    ts: now - (i + 1) * 47 * 60e3, likes: [], replyTo: null,
  }));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.posts) && Array.isArray(saved.users)) {
      return { session: null, progress: {}, ...saved };
    }
  } catch (e) { /* primeira visita ou storage indisponível */ }
  return { users: [], session: null, posts: seedPosts(), progress: {} };
}

let state = load();
const subs = new Set();

function commit(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* modo privado */ }
  subs.forEach((fn) => fn());
}

const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const getState = () => state;
export const useStore = () => useSyncExternalStore(subscribe, getState);

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    state = load();
    subs.forEach((fn) => fn());
  });
}

// ---- eventos do jogo (XP, nível, conquista) — quem escuta é o GameFX ----
const bus = new Set();
export const onGameEvent = (fn) => { bus.add(fn); return () => bus.delete(fn); };
const emit = (events) => events.forEach((ev) => bus.forEach((fn) => fn(ev)));
export const notify = (text) => emit([{ type: "note", text }]);

// ---- leitura ----
const blankProgress = () => ({
  xp: 0, read: [], posts: 0, replies: 0, likesGiven: 0, likedIds: [], bookmarks: [],
  badges: [], streak: 0, lastDay: null,
  games: { plays: 0, best: {}, played: [], perfect: [] },
  daily: { date: null, read: 0, post: 0, reply: 0, like: 0, game: 0, gameXp: 0, done: [] },
});

export function progressOf(s, userId) {
  const saved = s.progress[userId] || {};
  const blank = blankProgress();
  const p = { ...blank, ...saved, games: { ...blank.games, ...saved.games }, daily: { ...blank.daily, ...saved.daily } };
  if (p.daily.date !== today()) p.daily = { ...blankProgress().daily, date: today() };
  return p;
}

export const currentUser = (s) => s.users.find((u) => u.id === s.session) || null;

export function authorOf(s, userId) {
  if (userId.startsWith("mascote:")) {
    const w = worldById(userId.slice(8));
    return { id: userId, name: w.mascot, handle: w.handle, mascot: w.id, official: true };
  }
  const u = s.users.find((x) => x.id === userId);
  return u || { id: userId, name: "Conta removida", handle: "removida", mascot: null, gone: true };
}

export const repliesOf = (s, postId) => s.posts.filter((p) => p.replyTo === postId).sort((a, b) => a.ts - b.ts);

// ---- motor do jogo ----
// Aplica `mutate` no progresso do usuário e devolve o novo estado + os
// eventos gerados (XP, missões diárias, conquistas, subida de nível).
function play(s, userId, mutate) {
  const before = progressOf(s, userId);
  const p = structuredClone(before);
  const events = [];
  const gain = (amount, label) => { p.xp += amount; events.push({ type: "xp", amount, label }); };

  if (p.lastDay !== today()) {
    p.streak = p.lastDay === yesterday() ? p.streak + 1 : 1;
    p.lastDay = today();
    gain(XP.daily, p.streak > 1 ? `${p.streak} dias seguidos` : "Bônus diário");
  }
  if (mutate) mutate(p, gain);

  for (const d of DAILY) {
    if (!p.daily.done.includes(d.id) && p.daily[d.id] >= d.goal) {
      p.daily.done.push(d.id);
      gain(d.xp, "Missão diária cumprida");
    }
  }
  for (const b of BADGES) {
    if (!p.badges.includes(b.id) && b.test(p)) {
      p.badges.push(b.id);
      events.push({ type: "badge", badge: b });
    }
  }
  const level = levelInfo(p.xp).level;
  if (level > levelInfo(before.xp).level) events.push({ type: "level", level, title: levelInfo(p.xp).title });

  return { next: { ...s, progress: { ...s.progress, [userId]: p } }, events };
}

function run(base, userId, mutate) {
  const { next, events } = play(base, userId, mutate);
  commit(next);
  emit(events);
}

// ---- contas ----
async function hashPassword(password, salt) {
  const text = `${salt}:${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // crypto.subtle só existe em https/localhost; este fallback evita travar o cadastro fora disso.
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `weak-${(h >>> 0).toString(16)}`;
}

function makeHandle(name, users) {
  const base = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "jogador";
  const taken = new Set([...users.map((u) => u.handle), ...WORLDS.map((w) => w.handle), "removida"]);
  let handle = base;
  for (let n = 2; taken.has(handle); n++) handle = `${base}${n}`;
  return handle;
}

export async function signUp({ name, email, password, mascot }) {
  name = name.trim();
  email = email.trim().toLowerCase();
  if (name.length < 2) throw new Error("Escolha um nome com pelo menos 2 letras.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Esse e-mail não parece válido.");
  if (password.length < 6) throw new Error("A senha precisa de pelo menos 6 caracteres.");
  if (!worldById(mascot)) throw new Error("Escolha um personagem para continuar.");
  if (state.users.some((u) => u.email === email)) throw new Error("Já existe uma conta com esse e-mail. Tente entrar.");

  const salt = uid();
  const hash = await hashPassword(password, salt);
  const user = { id: uid(), name: name.slice(0, 30), handle: makeHandle(name, state.users), email, salt, hash, mascot, bio: "", createdAt: Date.now() };
  run({ ...state, users: [...state.users, user], session: user.id }, user.id, (p, gain) => gain(XP.signup, "Bem-vindo ao Plural"));
  return user;
}

export async function logIn({ email, password }) {
  const user = state.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || (await hashPassword(password, user.salt)) !== user.hash) throw new Error("E-mail ou senha incorretos.");
  run({ ...state, session: user.id }, user.id);
  return user;
}

export const logOut = () => commit({ ...state, session: null });

// Chamado quando o app abre: conta o dia na sequência e dá o bônus diário.
export function checkIn() {
  const me = currentUser(state);
  if (me && progressOf(state, me.id).lastDay !== today()) run(state, me.id);
}

export function updateProfile(patch) {
  const me = currentUser(state);
  if (!me) return;
  const clean = {};
  if (typeof patch.name === "string" && patch.name.trim().length >= 2) clean.name = patch.name.trim().slice(0, 30);
  if (typeof patch.bio === "string") clean.bio = patch.bio.trim().slice(0, 140);
  if (worldById(patch.mascot)) clean.mascot = patch.mascot;
  commit({ ...state, users: state.users.map((u) => (u.id === me.id ? { ...u, ...clean } : u)) });
}

// ---- ações ----

// Fim de uma partida no Arcade. `id` é o recorde ("quiz-tecnologia", "memoria"...),
// `kind` agrupa ("quiz" ou o próprio jogo). Devolve o XP dado e se bateu recorde.
export function finishGame({ id, kind, world = null, score, xp, perfect = false }) {
  const me = currentUser(state);
  if (!me) return { granted: 0, record: false, capped: false, guest: true };
  const before = progressOf(state, me.id);
  const room = Math.max(0, GAME_CAP - before.daily.gameXp);
  const granted = Math.max(0, Math.min(Math.round(xp), room));
  const record = score > (before.games.best[id] ?? -Infinity);
  run(state, me.id, (p, gain) => {
    p.games = { ...p.games, plays: p.games.plays + 1 };
    if (record) p.games.best = { ...p.games.best, [id]: score };
    if (!p.games.played.includes(kind)) p.games.played = [...p.games.played, kind];
    if (perfect && world && !p.games.perfect.includes(world)) p.games.perfect = [...p.games.perfect, world];
    p.daily.game += 1;
    p.daily.gameXp += granted;
    if (granted > 0) gain(granted, "Arcade");
  });
  return { granted, record, capped: granted < Math.round(xp), guest: false };
}
export function completeMission(worldId, index) {
  const me = currentUser(state);
  const key = missionKey(worldId, index);
  if (!me || progressOf(state, me.id).read.includes(key)) return false;
  run(state, me.id, (p, gain) => {
    p.read.push(key);
    p.daily.read += 1;
    gain(XP.read, "Missão concluída");
  });
  return true;
}

export function createPost({ text, topic, replyTo = null, mission = null }) {
  const me = currentUser(state);
  text = text.trim().slice(0, MAX_POST);
  if (!me || !text || !worldById(topic)) return null;
  const post = { id: uid(), userId: me.id, topic, text, ts: Date.now(), likes: [], replyTo, mission };
  run({ ...state, posts: [post, ...state.posts] }, me.id, (p, gain) => {
    const kind = replyTo ? "reply" : "post";
    if (replyTo) p.replies += 1; else p.posts += 1;
    p.daily[kind] += 1;
    if (p.daily[kind] <= DAILY_CAPS[kind]) gain(XP[kind], replyTo ? "Resposta enviada" : "Post publicado");
  });
  return post;
}

export function toggleLike(postId) {
  const me = currentUser(state);
  const post = state.posts.find((p) => p.id === postId);
  if (!me || !post) return;
  const liked = post.likes.includes(me.id);
  const posts = state.posts.map((p) =>
    p.id === postId ? { ...p, likes: liked ? p.likes.filter((id) => id !== me.id) : [...p.likes, me.id] } : p
  );
  // XP só na primeira curtida de cada post alheio — descurtir e curtir de novo não rende.
  const firstTime = !liked && post.userId !== me.id && !progressOf(state, me.id).likedIds.includes(postId);
  if (!firstTime) return commit({ ...state, posts });
  run({ ...state, posts }, me.id, (p, gain) => {
    p.likedIds.push(postId);
    p.likesGiven += 1;
    p.daily.like += 1;
    gain(XP.like, "Curtida");
  });
}

export function toggleBookmark(postId) {
  const me = currentUser(state);
  if (!me) return;
  const p = progressOf(state, me.id);
  const bookmarks = p.bookmarks.includes(postId) ? p.bookmarks.filter((id) => id !== postId) : [...p.bookmarks, postId];
  commit({ ...state, progress: { ...state.progress, [me.id]: { ...p, bookmarks } } });
}

export function deletePost(postId, { asAdmin = false } = {}) {
  const me = currentUser(state);
  const post = state.posts.find((p) => p.id === postId);
  if (!post || !me || !(post.userId === me.id || (asAdmin && isAdmin(me)))) return;
  commit({ ...state, posts: state.posts.filter((p) => p.id !== postId && p.replyTo !== postId) });
}

export function deleteUser(userId) {
  if (!isAdmin(currentUser(state))) return;
  const gone = new Set(state.posts.filter((p) => p.userId === userId).map((p) => p.id));
  const progress = { ...state.progress };
  delete progress[userId];
  commit({
    ...state,
    users: state.users.filter((u) => u.id !== userId),
    session: state.session === userId ? null : state.session,
    posts: state.posts.filter((p) => !gone.has(p.id) && !gone.has(p.replyTo)).map((p) => ({ ...p, likes: p.likes.filter((id) => id !== userId) })),
    progress,
  });
}
