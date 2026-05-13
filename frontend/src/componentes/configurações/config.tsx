import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, User } from "lucide-react";
import Swal from "sweetalert2";
import { MainLayout } from "../SideBarUniversal";
import type { UserRole } from "../../helpes/InteligenciaSideBar";

function getEmailFromToken() {
  const token = localStorage.getItem("token");

  if (!token) return "";

  try {
    const tokenPayload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(tokenPayload));
    return payload.email ?? "";
  } catch {
    return "";
  }
}

function Config({ userRole = "aluno" }: { userRole?: UserRole }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const nomeAluno = localStorage.getItem("nome") ?? "Aluno";
  const emailAluno =
    localStorage.getItem("email") || getEmailFromToken() || "E-mail não informado";
  const inicialAluno = nomeAluno.trim().charAt(0).toUpperCase() || "A";

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Senhas diferentes",
        text: "A nova senha e a confirmação precisam ser iguais.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:3000/auth/change-password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Erro ao alterar senha",
        text: "Verifique a senha antiga e tente novamente.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Senha alterada",
      text: "Sua senha foi atualizada com sucesso.",
      confirmButtonColor: "#15803d",
    });

    const userId = localStorage.getItem("userId") ?? "me";
    localStorage.setItem(`passwordChangedAt:${userId}`, new Date().toISOString());
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <MainLayout userRole={userRole}>
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 sm:py-8">
        {/* Wrapper centralizado */}
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#0b4d2c] px-6 py-6 text-white sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl font-black shadow-inner">
                  {inicialAluno}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                    Perfil do aluno
                  </p>
                  <h1 className="mt-1 truncate text-2xl font-black text-white sm:text-3xl">
                    {nomeAluno}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-white/60">
                    SECTEC · Projeto Escolar
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sectec-100 text-sectec-700">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nome
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {nomeAluno}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sectec-100 text-sectec-700">
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    E-mail institucional
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {emailAluno}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-6">
          {/* Banner de segurança */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-amber-900 sm:text-lg">
              Recomendação de segurança
            </h2>
            <p className="mt-1 text-xs text-amber-800 sm:text-sm">
              Por segurança, recomendamos alterar sua senha periodicamente.
              Escolha uma nova senha que não seja usada em outros sistemas.
            </p>
          </div>

          {/* Card do formulário */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Alterar senha
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Informe sua senha atual e cadastre uma nova senha de acesso.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Senha antiga
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-transparent focus:ring-2 focus:ring-sectec-500 sm:text-base"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-transparent focus:ring-2 focus:ring-sectec-500 sm:text-base"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-transparent focus:ring-2 focus:ring-sectec-500 sm:text-base"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-sectec-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sectec-800 active:scale-[0.98] sm:w-auto sm:text-base"
              >
                Salvar nova senha
              </button>
            </form>
          </section>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}

export default Config;
