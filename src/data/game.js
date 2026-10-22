import { WORLDS } from "./categories";
import { BLOGS } from "./blogs";

// Quanto vale cada ação.
export const XP = { read: 50, post: 20, reply: 10, like: 2, daily: 10, signup: 30 };

// Limites diários de ações que rendem XP (publicar continua liberado depois disso).
export const DAILY_CAPS = { post: 5, reply: 10 };

// Jogos: no máximo GAME_CAP de XP por dia somando todos (dá pra continuar jogando por diversão).
export const GAME_CAP = 150;

export const GAMES = [
  { id: "memoria", name: "Memória dos Mascotes", desc: "Vire as cartas e ache os pares no menor número de jogadas.", icon: "grid", c: "#2D9CFF", max: 50 },
  { id: "pega-xp", name: "Pega-XP", desc: "30 segundos: toque nos mascotes e nas moedas, fuja das bombas.", icon: "bolt", c: "#FF8A1F", max: 50 },
  { id: "verdade", name: "Verdade ou Mito", desc: "Arraste a carta: direita é verdade, esquerda é mito. Corra contra o tempo!", icon: "swap", c: "#FF2D87", max: 50 },
];

// XP de cada jogo a partir do resultado
export const gameXp = {
  quiz: ({ correct, total }) => correct * 8 + (correct === total ? 20 : 0),
  memoria: ({ moves }) => Math.max(10, Math.min(50, 50 - (moves - 6) * 2)),
  "pega-xp": ({ score }) => Math.max(0, Math.min(50, Math.floor(score / 8))),
  verdade: ({ correct }) => Math.min(50, correct * 4),
};

const need = (level) => 80 + 40 * (level - 1);

const TITLES = [
  "Novato", "Curioso", "Explorador", "Aventureiro", "Desbravador",
  "Veterano", "Especialista", "Mestre", "Campeão", "Lenda",
];

export function levelInfo(xp) {
  let level = 1;
  let into = xp;
  while (into >= need(level)) {
    into -= need(level);
    level += 1;
  }
  return {
    level,
    into,
    need: need(level),
    pct: Math.round((into / need(level)) * 100),
    title: TITLES[Math.min(level, TITLES.length) - 1],
  };
}

export const missionKey = (worldId, index) => `${worldId}:${index}`;
export const readIn = (p, worldId) => p.read.filter((k) => k.startsWith(worldId + ":")).length;
export const TOTAL_MISSIONS = WORLDS.reduce((n, w) => n + BLOGS[w.id].length, 0);

// Missões diárias: `id` é o contador em progress.daily.
export const DAILY = [
  { id: "read", label: "Conclua 1 missão de leitura", goal: 1, xp: 15, icon: "book" },
  { id: "post", label: "Publique 1 post na comunidade", goal: 1, xp: 15, icon: "send" },
  { id: "like", label: "Curta 3 posts de outras pessoas", goal: 3, xp: 10, icon: "heart" },
  { id: "game", label: "Jogue 1 mini jogo ou quiz", goal: 1, xp: 10, icon: "gamepad" },
];

export const BADGES = [
  { id: "primeira-missao", name: "Primeiro passo", desc: "Conclua sua primeira missão.", icon: "star", c: "#FFD23F", test: (p) => p.read.length >= 1 },
  { id: "voz-ativa", name: "Voz ativa", desc: "Publique seu primeiro post.", icon: "send", c: "#2D9CFF", test: (p) => p.posts >= 1 },
  { id: "boa-vizinhanca", name: "Boa vizinhança", desc: "Curta 10 posts de outras pessoas.", icon: "heart", c: "#FF2D87", test: (p) => p.likesGiven >= 10 },
  { id: "responde-ai", name: "Responde aí", desc: "Envie 5 respostas.", icon: "message", c: "#2FCB5A", test: (p) => p.replies >= 5 },
  { id: "em-chamas", name: "Em chamas", desc: "Entre 3 dias seguidos.", icon: "flame", c: "#FF8A1F", test: (p) => p.streak >= 3 },
  { id: "tagarela", name: "Tagarela", desc: "Publique 10 posts.", icon: "sparkles", c: "#A24BFF", test: (p) => p.posts >= 10 },
  { id: "maratonista", name: "Maratonista", desc: "Conclua 10 missões.", icon: "bolt", c: "#FFD23F", test: (p) => p.read.length >= 10 },
  { id: "explorador", name: "Explorador", desc: "Conclua uma missão em cada mundo.", icon: "compass", c: "#2D9CFF", test: (p) => WORLDS.every((w) => readIn(p, w.id) >= 1) },
  ...WORLDS.map((w) => ({
    id: `mestre-${w.id}`, name: `Mestre: ${w.name.split(" ")[0]}`, desc: `Conclua todas as missões de ${w.name}.`,
    world: w.id, c: w.c, test: (p) => readIn(p, w.id) >= BLOGS[w.id].length,
  })),
  { id: "primeira-partida", name: "Player 1", desc: "Jogue sua primeira partida no Arcade.", icon: "gamepad", c: "#2D9CFF", test: (p) => p.games.plays >= 1 },
  { id: "arcade", name: "Rato de arcade", desc: "Jogue os 3 mini jogos e um quiz.", icon: "trophy", c: "#FF8A1F", test: (p) => ["memoria", "pega-xp", "verdade", "quiz"].every((g) => p.games.played.includes(g)) },
  { id: "genio", name: "Gênio", desc: "Acerte todas as perguntas de um quiz.", icon: "bulb", c: "#FFD23F", test: (p) => p.games.perfect.length >= 1 },
  { id: "sabe-tudo", name: "Sabe-tudo", desc: "Gabarite o quiz de todos os mundos.", icon: "crown", c: "#A24BFF", test: (p) => WORLDS.every((w) => p.games.perfect.includes(w.id)) },
  { id: "plural", name: "Verdadeiramente plural", desc: "Conclua todas as missões de todos os mundos.", icon: "crown", c: "#FFD23F", test: (p) => p.read.length >= TOTAL_MISSIONS },
];
