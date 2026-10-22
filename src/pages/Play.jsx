import { Navigate, useParams } from "react-router-dom";
import { worldById } from "../data/categories";
import Quiz from "../games/Quiz";
import Memory from "../games/Memory";
import Whack from "../games/Whack";
import TrueFalse from "../games/TrueFalse";

const GAMES = { memoria: Memory, "pega-xp": Whack, verdade: TrueFalse };

export default function Play() {
  const { gameId } = useParams();
  if (gameId.startsWith("quiz-") && worldById(gameId.slice(5))) {
    const world = gameId.slice(5);
    return <Quiz key={world} world={world} />;
  }
  const Game = GAMES[gameId];
  return Game ? <Game /> : <Navigate to="/jogos" replace />;
}
