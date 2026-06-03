import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import loginImg from "../assets/img/Login.png";
import { apiRequest } from "../lib/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Link inválido",
        text: "Solicite um novo link de recuperação de senha.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    if (password.length < 6) {
      await Swal.fire({
        icon: "warning",
        title: "Senha muito curta",
        text: "A nova senha precisa ter pelo menos 6 caracteres.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    if (password !== confirmPassword) {
      await Swal.fire({
        icon: "warning",
        title: "Senhas diferentes",
        text: "Digite a mesma senha nos dois campos.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest<{ message: string }>("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: {
          token,
          newPassword: password,
        },
      });

      await Swal.fire({
        title: "Senha redefinida",
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
            <div style="width:64px;height:64px;border-radius:20px;background:#f0fdf4;border:1px solid #dcfce7;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#15803d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p style="margin:0;color:#64748b;font-size:15px;line-height:1.5;">
              Sua senha foi alterada com sucesso. Entre novamente para continuar.
            </p>
          </div>
        `,
        confirmButtonText: "Ir para login",
        confirmButtonColor: "#15803d",
        background: "#ffffff",
        color: "#0f172a",
        width: 460,
        padding: "2.2rem",
        customClass: {
          popup: "sectec-modal",
          title: "sectec-modal-title",
          confirmButton: "sectec-modal-confirm",
        },
      });

      navigate("/login", { replace: true });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível redefinir",
        text:
          error instanceof Error
            ? error.message
            : "O link pode estar inválido ou expirado.",
        confirmButtonColor: "#15803d",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen font-[Poppins] overflow-hidden">
      <section className="flex w-full flex-row">
        <div className="hidden bg-sectec-50 lg:block w-1/2 overflow-hidden">
          <img
            src={loginImg}
            alt="Ilustração de estudos"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
          <div className="w-full max-w-md">
            <div className="mb-10 flex justify-center">
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-2 gap-1">
                  <span className="h-7 w-7 rounded-lg bg-sectec-700" />
                  <span className="h-7 w-7 rounded-lg bg-sectec-100" />
                  <span className="h-7 w-7 rounded-lg bg-sectec-600" />
                  <span className="h-7 w-7 rounded-lg bg-sectec-700" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-extrabold text-green-900">SECTEC</h1>
                  <p className="text-sm text-green-600">Projeto Escolar</p>
                </div>
              </div>
            </div>

            <div>
              <div className="text-center mb-8">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-sectec-700">
                  <LockKeyhole size={30} />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900">Redefinir senha</h2>
                <p className="text-slate-500 mt-2">
                  Crie uma nova senha para acessar sua conta.
                </p>
              </div>

              {!token ? (
                <div className="space-y-5 text-center">
                  <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    Link de redefinição inválido ou sem token.
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-sectec-700 py-3 px-4 text-white font-semibold text-base hover:bg-sectec-800 active:scale-[0.98] transition-all duration-150"
                  >
                    Voltar para login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua nova senha"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-sectec-700 focus:outline-none focus:text-sectec-700"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-sectec-700 focus:outline-none focus:text-sectec-700"
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                        title={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-sectec-700 py-3 px-4 text-white font-semibold text-base hover:bg-sectec-800 active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:active:scale-100"
                  >
                    {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
                  </button>

                  <div className="text-center">
                    <Link
                      to="/login"
                      className="text-sm text-sectec-600 hover:text-sectec-700 hover:underline transition"
                    >
                      Voltar para login
                    </Link>
                  </div>
                </form>
              )}
            </div>

            <p className="mt-8 text-xs text-slate-400 text-center">
              &copy; 2026 SECTEC &middot; Projeto Escolar &middot; Ceará
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ResetPassword;
