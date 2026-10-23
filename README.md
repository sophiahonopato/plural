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

## Comunidade e ranking online (Supabase)

Sem configuração, o site roda no **modo local**: contas, posts e XP ficam só no
navegador de cada pessoa. Para todo mundo ver os mesmos posts e competir no
mesmo ranking, ligue o Supabase (tem plano grátis):

1. Crie uma conta em https://supabase.com e um projeto novo.
2. No projeto, abra **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
   Isso cria as tabelas, as regras de segurança, o anti-trapaça de XP e os posts dos mascotes.
3. Em **Authentication → Sign In / Providers → Email**, decida sobre **Confirm email**:
   - desligado: a pessoa cria a conta e já entra;
   - ligado: ela precisa clicar no link do e-mail antes de entrar (o site avisa).
4. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public*.
5. Copie `.env.example` para `.env` e cole os dois valores. Rode `npm run dev` de novo.
6. Na hospedagem (Vercel, Netlify...), cadastre as mesmas duas variáveis de ambiente.

A chave *anon* pode ficar no site: quem protege os dados são as regras do banco
(cada pessoa só altera os próprios dados, XP só sobe em passos pequenos e com
teto diário, um post a cada 3 segundos, e só admins apagam conteúdo dos outros).
Nunca coloque a chave *service_role* no site.

## Painel de moderação

O painel fica em `/admin` e só aparece para os e-mails listados em `ADMIN_EMAILS`
(`src/lib/store.js`). Quem entra com essa conta vê o botão "Moderação" no perfil.
No modo online, a permissão de verdade vem da tabela `admins` do banco. Para
adicionar alguém, rode no SQL Editor: `insert into public.admins values ('email@da.pessoa');`
e coloque o mesmo e-mail em `ADMIN_EMAILS`.
