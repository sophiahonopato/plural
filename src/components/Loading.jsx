import { motion } from "framer-motion";
import { WORLDS } from "../data/categories";
import Avatar from "./Avatar";

// Os mascotes pulando em onda enquanto os dados chegam.
export default function Loading({ label = "Carregando…" }) {
  return (
    <div className="grid min-h-[60vh] place-items-center pt-24" role="status">
      <div className="text-center">
        <div className="flex gap-2">
          {WORLDS.map((w, i) => (
            <motion.span key={w.id} animate={{ y: [0, -14, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}>
              <Avatar mascot={w.id} size={40} ring={false} />
            </motion.span>
          ))}
        </div>
        <p className="mt-4 font-bold text-mist">{label}</p>
      </div>
    </div>
  );
}
