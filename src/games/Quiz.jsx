import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { worldById } from "../data/categories";
import { QUIZ } from "../data/quiz";
import { gameXp } from "../data/game";
import { finishGame } from "../lib/store";
import { useSession } from "../lib/session";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { Frame, Intro, Result, Stat, shuffle } from "./Shell";

const ROUND = 6;
const SECONDS = 15;
const LETTERS = ["A", "B", "C", "D"];

function makeRound(world) {
  return shuffle(QUIZ[world]).slice(0, ROUND).map((q) => {
    const order = shuffle([0, 1, 2, 3]);
    return { ...q, o: order.map((k) => q.o[k]), a: order.indexOf(q.a) };
  });
}

const PRAISE = ["Boa!", "Mandou bem!", "Isso aí!", "Genial!", "Arrasou!"];

export default function Quiz({ world }) {
  const w = worldById(world);
  const { progress } = useSession();
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(() => makeRound(world));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null); // índice escolhido, -1 = tempo esgotado
  const [time, setTime] = useState(SECONDS);
  const [stats, setStats] = useState({ correct: 0, streak: 0, best: 0, score: 0 });
  const [gain, setGain] = useState(null);
  const [result, setResult] = useState(null);
  const tick = useRef(null);

  const q = round[i];
  const mult = Math.min(3, 1 + 0.5 * Math.max(0, stats.streak - 1));

  const answer = useCallback((k) => {
    if (picked !== null || phase !== "play") return;
    setPicked(k);
    const ok = k === q.a;
    const streak = ok ? stats.streak + 1 : 0;
    const m = Math.min(3, 1 + 0.5 * Math.max(0, streak - 1));
    const pts = ok ? Math.round((100 + time * 10) * m) : 0;
    setGain(ok ? { pts, m, id: Date.now() } : null);
    setStats({ correct: stats.correct + (ok ? 1 : 0), streak, best: Math.max(stats.best, streak), score: stats.score + pts });
  }, [picked, phase, q, time, stats]);

  // cronômetro da pergunta
  useEffect(() => {
    if (phase !== "play" || picked !== null) return undefined;
    tick.current = setInterval(() => setTime((t) => Math.max(0, +(t - 0.1).toFixed(1))), 100);
    return () => clearInterval(tick.current);
  }, [phase, picked, i]);
  useEffect(() => { if (time <= 0 && picked === null && phase === "play") answer(-1); }, [time, picked, phase, answer]);

  function next() {
    if (i + 1 < round.length) {
      setI(i + 1); setPicked(null); setTime(SECONDS); setGain(null);
      return;
    }
    const perfect = stats.correct === round.length;
    setResult(finishGame({ id: `quiz-${world}`, kind: "quiz", world, score: stats.score, xp: gameXp.quiz({ correct: stats.correct, total: round.length }), perfect }));
    setPhase("done");
  }

  // teclado: 1-4 / A-D para responder, Enter para seguir
  useEffect(() => {
    if (phase !== "play") return undefined;
    const onKey = (e) => {
      const k = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
      if (picked === null && k >= 0) answer(k);
      else if (picked !== null && e.key === "Enter") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function replay() {
    setRound(makeRound(world)); setI(0); setPicked(null); setTime(SECONDS);
    setStats({ correct: 0, streak: 0, best: 0, score: 0 }); setGain(null); setResult(null); setPhase("play");
  }

  const title = `Quiz: ${w.name}`;
  const icon = <Avatar mascot={w.id} size={44} />;

  if (phase === "intro") {
    return (
      <Frame title={title} color={w.c} icon={icon}>
        <Intro
          art={<Avatar mascot={w.id} size={120} className="floaty" />}
          rules={[`${ROUND} perguntas sobre ${w.name}, ${SECONDS} segundos cada.`, "Responder rápido vale mais pontos.", "Acertos seguidos ativam o combo: até 3x os pontos.", `Gabaritou? Bônus de XP e ${w.mascot} fica orgulhoso.`]}
          best={progress?.games.best[`quiz-${world}`]}
          onStart={() => setPhase("play")}
        />
      </Frame>
    );
  }

  if (phase === "done") {
    const pct = stats.correct / round.length;
    return (
      <Frame title={title} color={w.c} icon={icon}>
        <Result
          title={pct === 1 ? "Gabaritou!" : pct >= 0.66 ? "Muito bem!" : pct >= 0.34 ? "Quase lá" : "Bora tentar de novo?"}
          score={stats.score} unit="pontos" stars={pct === 1 ? 3 : pct >= 0.66 ? 2 : pct >= 0.34 ? 1 : 0}
          details={`${stats.correct} de ${round.length} acertos · maior sequência: ${stats.best}`}
          result={result} onReplay={replay}
        />
      </Frame>
    );
  }

  const ok = picked !== null && picked === q.a;
  const mood = picked === null ? "idle" : ok ? "happy" : "sad";

  return (
    <Frame
      title={title} color={w.c} icon={icon}
      stats={<>
        <Stat icon="target">{i + 1}/{round.length}</Stat>
        <Stat icon="flame" tone={stats.streak > 1 ? "chip-gold" : ""}>{mult > 1 ? `x${mult}` : "combo"}</Stat>
        <Stat icon="star">{stats.score}</Stat>
      </>}
    >
      {/* barra de progresso em segmentos */}
      <div className="flex gap-1.5">
        {round.map((_, k) => (
          <span key={k} className="h-2 flex-1 overflow-hidden rounded-full bg-fg/10">
            <motion.i className="block h-full rounded-full" style={{ background: w.c }} initial={false} animate={{ width: k < i || (k === i && picked !== null) ? "100%" : "0%" }} />
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-4">
        <div className="relative shrink-0">
          <motion.div
            animate={mood === "happy" ? { y: [0, -18, 0], rotate: [0, -10, 10, 0] } : mood === "sad" ? { x: [0, -8, 8, -6, 6, 0] } : { y: [0, -4, 0] }}
            transition={mood === "idle" ? { duration: 2, repeat: Infinity } : { duration: 0.6 }}
          >
            <Avatar mascot={w.id} size={64} />
          </motion.div>
          {/* cronômetro circular */}
          <svg className="absolute -inset-2 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(26,16,48,.08)" strokeWidth="4" />
            <circle cx="40" cy="40" r="37" fill="none" stroke={time < 5 ? "#FF4040" : w.c} strokeWidth="4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - time / SECONDS} style={{ transition: "stroke-dashoffset .1s linear" }} />
          </svg>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={i} className="panel relative flex-1 p-5 sm:p-6"
            initial={{ x: 60, opacity: 0, rotateY: -25 }} animate={{ x: 0, opacity: 1, rotateY: 0 }} exit={{ x: -60, opacity: 0, rotateY: 25 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }} style={{ transformPerspective: 900 }}
          >
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-mist">Pergunta {i + 1} · <span className={time < 5 && picked === null ? "text-[#E02424]" : ""}>{Math.ceil(time)}s</span></p>
            <h2 className="display mt-2 text-xl font-bold leading-snug sm:text-2xl">{q.q}</h2>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        <AnimatePresence>
          {gain && (
            <motion.span
              key={gain.id} className="display pointer-events-none absolute -top-10 right-2 z-10 text-3xl font-black text-[#E8A400]"
              initial={{ y: 20, opacity: 0, scale: 0.5 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            >
              +{gain.pts}{gain.m > 1 && <span className="ml-1 text-lg">x{gain.m}</span>}
            </motion.span>
          )}
        </AnimatePresence>
        {q.o.map((opt, k) => {
          const isRight = picked !== null && k === q.a;
          const isWrong = picked === k && k !== q.a;
          return (
            <motion.button
              key={`${i}-${k}`} type="button" disabled={picked !== null} onClick={() => answer(k)}
              initial={{ y: 20, opacity: 0 }}
              animate={isWrong ? { x: [0, -10, 10, -6, 6, 0], y: 0, opacity: 1 } : isRight ? { scale: [1, 1.06, 1], y: 0, opacity: 1 } : { y: 0, opacity: picked !== null ? 0.45 : 1 }}
              transition={{ delay: picked === null ? 0.1 + k * 0.06 : 0 }}
              whileHover={picked === null ? { y: -3 } : undefined} whileTap={picked === null ? { scale: 0.96 } : undefined}
              className="flex items-center gap-3 rounded-2xl border-2 p-4 text-left text-[17px] font-bold disabled:cursor-default"
              style={{
                background: isRight ? "#2FCB5A" : isWrong ? "#FF4040" : "rgb(var(--surface))",
                borderColor: isRight ? "#1FA34C" : isWrong ? "#C81E1E" : "rgba(26,16,48,.1)",
                color: isRight || isWrong ? "#fff" : undefined,
                boxShadow: `0 5px 0 ${isRight ? "#14803A" : isWrong ? "#9B1515" : "rgba(26,16,48,.1)"}`,
              }}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black" style={{ background: isRight || isWrong ? "rgba(255,255,255,.25)" : `${w.c}1f`, color: isRight || isWrong ? "#fff" : w.c }}>
                {isRight ? <Icon name="check" size={16} strokeWidth={3.5} /> : isWrong ? <Icon name="x" size={16} strokeWidth={3.5} /> : LETTERS[k]}
              </span>
              {opt}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {picked !== null && (
          <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-5 flex flex-wrap items-center gap-4 rounded-3xl p-5" style={{ background: ok ? "#2FCB5A1f" : "#FF40401a" }}
          >
            <div className="min-w-0 flex-1">
              <p className="display text-lg font-black" style={{ color: ok ? "#14803A" : "#C81E1E" }}>
                {ok ? PRAISE[stats.correct % PRAISE.length] : picked === -1 ? "O tempo acabou!" : "Não foi dessa vez"}
              </p>
              <p className="mt-1 text-fg/80">{q.why}</p>
            </div>
            <button type="button" onClick={next} className="btn btn-world" autoFocus>
              {i + 1 < round.length ? "Próxima" : "Ver resultado"} <Icon name="arrow-right" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}
