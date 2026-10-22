import { useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { gsap } from "../lib/gsap";
import { WORLDS, worldById } from "../data/categories";
import { BLOGS } from "../data/blogs";
import { levelInfo } from "../data/game";
import { useSession, timeAgo } from "../lib/session";
import { MAX_POST, authorOf, createPost, deletePost, notify, progressOf, repliesOf, toggleBookmark, toggleLike } from "../lib/store";
import Icon from "./Icon";
import Avatar from "./Avatar";

function Counter({ value, max }) {
  const left = max - value;
  const r = 9;
  const C = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const color = left < 0 ? "#FF4040" : left <= 20 ? "#FFD23F" : "#8B3DFF";
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold tabular-nums" style={{ color: left <= 20 ? color : "#A9A1C6" }}>
      {left <= 20 && left}
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90" aria-hidden="true">
        <circle cx="12" cy="12" r={r} fill="none" stroke="rgba(26,16,48,.1)" strokeWidth="3" />
        <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
      </svg>
    </span>
  );
}

// Caixa de escrever. `fixedTopic` trava o tópico (usado nas respostas e nas missões).
export function Composer({ fixedTopic, replyTo = null, mission = null, placeholder, compact = false, onPosted }) {
  const { user } = useSession();
  const pillId = useId();
  const [text, setText] = useState("");
  const [topic, setTopic] = useState(fixedTopic || user?.mascot || WORLDS[0].id);
  const area = useRef(null);
  const activeTopic = fixedTopic || topic;
  const w = worldById(activeTopic);

  if (!user) {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 ${compact ? "rounded-2xl bg-fg/5 p-4" : "panel p-5"}`}>
        <p className="font-bold text-mist">{replyTo ? "Entre para responder." : "Entre para publicar e ganhar XP."}</p>
        <Link to="/entrar" className="btn btn-sm btn-gold">Entrar</Link>
      </div>
    );
  }

  const tooLong = text.length > MAX_POST;
  function submit(e) {
    e.preventDefault();
    if (!text.trim() || tooLong) return;
    const post = createPost({ text, topic: activeTopic, replyTo, mission });
    if (!post) return;
    setText("");
    if (area.current) area.current.style.height = "auto";
    onPosted?.(post);
  }

  return (
    <form onSubmit={submit} className={compact ? "rounded-2xl bg-fg/5 p-3" : "panel p-4 sm:p-5"} style={{ "--c": w.c }}>
      <div className="flex gap-3">
        <Avatar mascot={user.mascot} size={compact ? 34 : 44} />
        <textarea
          ref={area} value={text} rows={compact ? 1 : 2}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e); }}
          placeholder={placeholder || `O que você quer falar sobre ${w.name}?`}
          aria-label={replyTo ? "Sua resposta" : "Seu post"}
          className="min-h-[44px] w-full resize-none bg-transparent pt-2 text-[17px] leading-relaxed text-fg outline-none placeholder:text-mist/60"
        />
      </div>

      {!fixedTopic && (
        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 py-1" role="radiogroup" aria-label="Tópico do post">
          {WORLDS.map((x) => (
            <button
              key={x.id} type="button" role="radio" aria-checked={x.id === topic} onClick={() => setTopic(x.id)}
              className={`chip relative !py-1 !pl-1 transition-opacity ${x.id === topic ? "chip-world !bg-transparent" : "opacity-60 hover:opacity-100"}`}
              style={{ "--c": x.c }}
            >
              {x.id === topic && (
                <motion.span
                  layoutId={`topic-${pillId}`} className="absolute inset-0 rounded-full"
                  style={{ background: `color-mix(in srgb, ${x.c} 14%, transparent)` }}
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
              <span className="relative"><Avatar mascot={x.id} size={22} ring={false} /></span>
              <span className="relative">{x.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-3">
        <Counter value={text.length} max={MAX_POST} />
        <button type="submit" className="btn btn-sm btn-world" disabled={!text.trim() || tooLong}>
          {replyTo ? "Responder" : "Publicar"} <Icon name="send" size={15} />
        </button>
      </div>
    </form>
  );
}

function Action({ icon, label, count, active, color, onClick, fill }) {
  return (
    <motion.button
      whileTap={{ scale: 0.8 }} transition={{ type: "spring", stiffness: 600, damping: 15 }}
      type="button" onClick={onClick} aria-label={label} aria-pressed={active}
      className="group flex items-center gap-1.5 rounded-full py-1 pr-2 text-sm font-bold text-mist transition-colors hover:text-[color:var(--a)]"
      style={{ "--a": color, color: active ? color : undefined }}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full transition-colors group-hover:bg-fg/10">
        <Icon name={icon} size={17} fill={fill && active} />
      </span>
      {count > 0 && (
        <motion.span key={count} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">{count}</motion.span>
      )}
    </motion.button>
  );
}

export function PostCard({ post, asReply = false, defaultOpen = false }) {
  const { state, user, progress } = useSession();
  const [open, setOpen] = useState(defaultOpen);
  const heart = useRef(null);
  const author = authorOf(state, post.userId);
  const w = worldById(post.topic);
  const replies = asReply ? [] : repliesOf(state, post.id);
  const liked = !!user && post.likes.includes(user.id);
  const saved = !!progress && progress.bookmarks.includes(post.id);
  const authorLevel = author.official || author.gone ? null : levelInfo(progressOf(state, author.id).xp).level;
  const article = post.mission && BLOGS[post.mission.world]?.[post.mission.index];

  function like() {
    if (!user) return notify("Entre para curtir posts");
    if (!liked) {
      gsap.fromTo(heart.current, { scale: 0.6 }, { scale: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)" });
      const burst = heart.current.querySelectorAll("i");
      gsap.fromTo(burst, { x: 0, y: 0, scale: 1, opacity: 1 }, {
        x: (i) => Math.cos((i / burst.length) * Math.PI * 2) * 22,
        y: (i) => Math.sin((i / burst.length) * Math.PI * 2) * 22,
        scale: 0, opacity: 0, duration: 0.55, ease: "power2.out",
      });
    }
    toggleLike(post.id);
  }

  function share() {
    const url = `${location.origin}/comunidade?topico=${post.topic}`;
    navigator.clipboard?.writeText(`${post.text}\n— @${author.handle} no Plural · ${url}`).then(() => notify("Post copiado"), () => notify("Não deu pra copiar"));
  }

  function remove() {
    if (window.confirm(asReply ? "Apagar esta resposta?" : "Apagar este post e as respostas dele?")) deletePost(post.id);
  }

  const Name = author.official || author.gone ? "span" : Link;
  return (
    <motion.article
      whileHover={asReply ? undefined : { y: -3, boxShadow: `0 24px 50px -24px ${w.c}88` }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={asReply ? "flex gap-3 py-3" : "post panel flex gap-3 p-4 sm:gap-4 sm:p-5"} style={{ "--c": w.c }}
    >
      <div className="flex flex-col items-center">
        <Avatar mascot={author.mascot} size={asReply ? 34 : 46} />
        {open && replies.length > 0 && <span className="mt-2 w-0.5 flex-1 rounded bg-fg/10" />}
      </div>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Name to={`/u/${author.handle}`} className="truncate font-extrabold text-fg hover:underline">{author.name}</Name>
          {author.official && <span className="chip chip-world !px-2 !py-0 text-[10px]"><Icon name="check" size={10} strokeWidth={4} /> Mascote</span>}
          {authorLevel && <span className="chip chip-gold !px-2 !py-0 text-[10px]">NV {authorLevel}</span>}
          <span className="text-mist">@{author.handle} · {timeAgo(post.ts)}</span>
        </header>

        <p className={`mt-1.5 whitespace-pre-wrap break-words leading-relaxed text-fg/90 ${asReply ? "text-[15px]" : "text-[17px]"}`}>{post.text}</p>

        {!asReply && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={`/comunidade?topico=${w.id}`} className="chip chip-world hover:brightness-125">#{w.name.split(" ")[0]}</Link>
            {article && (
              <Link to={`/mundo/${post.mission.world}/${post.mission.index}`} className="chip max-w-full hover:bg-fg/15">
                <Icon name="book" size={12} /><span className="truncate">{article.title}</span>
              </Link>
            )}
          </div>
        )}

        <footer className="-ml-2 mt-2 flex items-center gap-1 sm:gap-4">
          {!asReply && <Action icon="message" label="Respostas" count={replies.length} active={open} color="#2D9CFF" onClick={() => setOpen((v) => !v)} />}
          <span ref={heart} className="relative">
            {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className="pointer-events-none absolute left-4 top-4 h-1.5 w-1.5 rounded-full bg-[#FF2D87] opacity-0" />)}
            <Action icon="heart" label="Curtir" count={post.likes.length} active={liked} color="#FF2D87" onClick={like} fill />
          </span>
          {!asReply && <Action icon="bookmark" label="Salvar" active={saved} color="#FFD23F" onClick={() => (user ? toggleBookmark(post.id) : notify("Entre para salvar posts"))} fill />}
          {!asReply && <Action icon="share" label="Copiar post" color="#2FCB5A" onClick={share} />}
          {user?.id === post.userId && <span className="ml-auto"><Action icon="trash" label="Apagar" color="#FF4040" onClick={remove} /></span>}
        </footer>

        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="mt-2 overflow-hidden border-t border-fg/10 pt-1">
            <div className="divide-y divide-fg/5">
              {replies.map((r) => <PostCard key={r.id} post={r} asReply />)}
            </div>
            <div className="mt-2">
              <Composer fixedTopic={post.topic} replyTo={post.id} compact placeholder={`Responder @${author.handle}`} />
            </div>
          </motion.div>
        )}
      </div>
    </motion.article>
  );
}
