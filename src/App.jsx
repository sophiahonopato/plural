import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ScrollTrigger, reducedMotion } from "./lib/gsap";
import { checkIn } from "./lib/store";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GameFX from "./components/GameFX";
import Backdrop from "./components/Backdrop";
import RouteCurtain from "./components/RouteCurtain";
import Home from "./pages/Home";
import World from "./pages/World";
import Mission from "./pages/Mission";
import Community from "./pages/Community";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Arcade from "./pages/Arcade";
import Play from "./pages/Play";

export default function App() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    checkIn();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  // troca de página: volta pro topo (ou pra âncora) e o conteúdo entra suave
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);

  return (
    <>
      <Backdrop />
      <Navbar />
      <main className="min-h-[100svh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mundo/:worldId" element={<World />} />
          <Route path="/mundo/:worldId/:index" element={<Mission />} />
          <Route path="/comunidade" element={<Community />} />
          <Route path="/jogos" element={<Arcade />} />
          <Route path="/jogos/:gameId" element={<Play />} />
          <Route path="/entrar" element={<Auth />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/u/:handle" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <GameFX />
      <RouteCurtain key={pathname} />
    </>
  );
}
