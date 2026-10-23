// Conexão com o Supabase. Sem as variáveis abaixo no .env, o site roda no
// modo local (tudo salvo no navegador) — veja o README.
import { createClient } from "@supabase/supabase-js";

const env = import.meta.env;
// Aceita os nomes do .env local (VITE_) e os que a integração do Vercel cria (NEXT_PUBLIC_).
const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const db = url && key ? createClient(url, key) : null;
export const ONLINE = !!db;

// Linhas do banco → formato que o app usa
export const toUser = (r) => ({
  id: r.id, name: r.name, handle: r.handle, mascot: r.mascot, bio: r.bio || "", createdAt: Date.parse(r.created_at),
});

export const toPost = (r) => ({
  id: r.id,
  userId: r.user_id || `mascote:${r.mascot}`,
  topic: r.topic,
  text: r.text,
  ts: Date.parse(r.created_at),
  likes: (r.likes || []).map((l) => l.user_id),
  replyTo: r.reply_to,
  mission: r.mission,
});

// Traduz os erros mais comuns do Supabase Auth
export function authMessage(error) {
  const m = (error?.message || "").toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) return "Já existe uma conta com esse e-mail. Tente entrar.";
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("password")) return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Espere um pouco e tente de novo.";
  return error?.message || "Algo deu errado. Tente de novo.";
}
