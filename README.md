# Plural

Site gamificado de conteúdo por tópicos: seis mundos com mascotes, missões de leitura
que dão XP, níveis, conquistas, sequência diária e uma comunidade estilo Twitter
onde cada pessoa publica sobre o tópico que quiser.

## Rodar

```bash
npm install
npm run dev
```

## Stack

- React + Vite + Tailwind
- GSAP (ScrollTrigger, SplitText, Draggable) para animações de scroll e o carrossel 3D
- Framer Motion para transições de página, pílulas animadas, feed e toasts de XP
- Three.js para as peças 3D do topo (`src/components/HeroScene.jsx`)

## Onde mexer

- `src/data/categories.js`: os mundos (cor, mascote, descrição)
- `src/data/blogs.js`: as missões (artigos) de cada mundo
- `src/data/game.js`: quanto XP vale cada ação, níveis, missões diárias e conquistas
- `src/lib/store.js`: contas, posts e progresso
- `src/index.css`: cores do tema (`--fg`, `--surface`, `--mist`) e o granulado

## Painel de moderação

O painel fica em `/admin` e só abre para os e-mails listados em `ADMIN_EMAILS`
(`src/lib/store.js`). Quem entra com essa conta vê o botão "Moderação" no perfil.

## Importante antes de publicar

Contas e posts ficam no `localStorage` do navegador: cada navegador tem a própria
comunidade, e a checagem de admin roda no cliente. Para uma comunidade compartilhada
de verdade (e um admin seguro), troque as funções de `src/lib/store.js` por chamadas
a um backend (Supabase, Firebase ou API própria).
# plural
