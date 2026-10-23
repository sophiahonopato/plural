import { avatarOf, worldById } from "../data/categories";

// Avatar = a foto de perfil do personagem escolhido, com anel na cor do mundo.
export default function Avatar({ mascot, size = 44, ring = true, className = "" }) {
  const w = worldById(mascot);
  return (
    <span
      className={`relative inline-block shrink-0 rounded-full ${className}`}
      style={{
        width: size, height: size,
        background: w ? w.c : "#35256A",
        boxShadow: ring && w ? `0 0 0 2px #0B0718, 0 0 0 ${size > 60 ? 5 : 4}px ${w.c}` : undefined,
      }}
    >
      {w && (
        <img
          src={avatarOf(w.id)}
          srcSet={`/avatars/sm/${w.id}.webp 160w, ${avatarOf(w.id)} 640w`}
          sizes={`${size}px`}
          alt={w.mascot} width={size} height={size} draggable={false} decoding="async"
          className="block h-full w-full rounded-full object-cover"
        />
      )}
    </span>
  );
}
