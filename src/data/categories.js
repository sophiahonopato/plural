// Os 6 mundos do Plural. `c` é a cor principal (pensada pra fundo escuro),
// `deep` é o tom fechado usado em sombras e gradientes.
export const WORLDS = [
  {
    id: "tecnologia", name: "Tecnologia", mascot: "Raposa", handle: "raposa",
    c: "#FF2D87", deep: "#8F1049",
    desc: "Ferramentas, ideias e o mundo digital explicado por quem vive nele.",
    welcome: "Bem-vindos ao mundo da Tecnologia! Qual app ou ferramenta mudou a sua rotina este ano? Conta aqui que eu quero testar.",
  },
  {
    id: "politica", name: "Política", mascot: "Coruja", handle: "coruja",
    c: "#FF4040", deep: "#8A1010",
    desc: "Entender o país (e o mundo) com clareza, sem ruído.",
    welcome: "Aqui a gente debate com respeito e com fonte. Qual assunto do noticiário você queria que alguém explicasse sem enrolação?",
  },
  {
    id: "alimentacao", name: "Alimentação", mascot: "Coala", handle: "coala",
    c: "#2FCB5A", deep: "#0F7A34",
    desc: "Comer bem, com prazer e sem complicação.",
    welcome: "Cozinha aberta! Qual é aquela receita rápida que salva o seu dia corrido? Vale até miojo turbinado.",
  },
  {
    id: "esportes", name: "Esportes", mascot: "Leão", handle: "leao",
    c: "#FF8A1F", deep: "#B85400",
    desc: "Movimento, disciplina e as histórias que o esporte conta.",
    welcome: "Bora se mexer! Me conta: qual esporte você pratica, ou qual você sempre quis começar?",
  },
  {
    id: "estudos", name: "Estudos e Vestibulares", mascot: "Golfinho", handle: "golfinho",
    c: "#2D9CFF", deep: "#0F5FB0",
    desc: "Técnicas, rotina e ânimo pra chegar até a aprovação.",
    welcome: "Reta final é em equipe. Qual técnica de estudo funciona de verdade pra você? Compartilha com a turma.",
  },
  {
    id: "saudemental", name: "Saúde Mental", mascot: "Polvo", handle: "polvo",
    c: "#A24BFF", deep: "#5B16B8",
    desc: "Espaço pra desacelerar, entender sentimentos e se cuidar.",
    welcome: "Respira. Este é um espaço seguro. O que te ajuda a desacelerar quando o dia pesa?",
  },
];

export const worldById = (id) => WORLDS.find((w) => w.id === id);
export const avatarOf = (id) => `/avatars/${id}.webp`;
export const bannerOf = (id) => `/banners/${id}.webp`;
// Recortes centralizados no mascote: vertical (4:5) e horizontal (16:9)
export const cardOf = (id) => `/banners/card-${id}.webp`;
export const wideOf = (id) => `/banners/wide-${id}.webp`;
