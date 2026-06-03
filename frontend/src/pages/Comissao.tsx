import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LogOut, ShieldCheck } from "lucide-react";
import { clearSession } from "../lib/api";

function Comissao() {
  const navigate = useNavigate();
  const nome = localStorage.getItem("nome") || "Usuário";

  function sair() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(16,185,129,.28) 0 12%, transparent 12% 24%, rgba(15,23,42,.45) 24% 36%, transparent 36% 100%)",
          backgroundSize: "420px 420px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "420px 420px"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        animate={{ opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-xl rounded-[2rem] border border-white/15 bg-white/95 p-8 text-center shadow-2xl shadow-emerald-950/30 backdrop-blur"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
          <ShieldCheck size={30} />
        </span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          Comissão SECTEC
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">
          Você faz parte da comissão da SECTEC
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          {nome}, seu acesso está registrado como membro da comissão organizadora.
        </p>
        <button
          type="button"
          onClick={sair}
          className="mt-8 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
        >
          <LogOut size={17} />
          Sair
        </button>
      </motion.section>
    </main>
  );
}

export default Comissao;
