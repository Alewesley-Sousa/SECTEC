import { useState } from "react";
import type { FormEvent } from "react";
import Swal from "sweetalert2";
import { MainLayout } from "../SideBarUniversal";

function Config() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <MainLayout userRole="aluno">
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 sm:py-8">
        {/* Wrapper centralizado */}
        <div className="mx-auto w-full max-w-xl">

          {/* Banner de segurança */}
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5">
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
      </main>
    </MainLayout>
  );
}

export default Config;