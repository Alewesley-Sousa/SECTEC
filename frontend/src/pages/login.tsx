import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import loginImg from "../assets/img/Login.png";
import Swal from "sweetalert2";
import {
  apiRequest,
  getRoleRedirect,
  saveSession,
  type LoginResponse,
} from "../lib/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleForgotPassword() {
    const { value: emailValue } = await Swal.fire({
      title: "Recuperar senha",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div style="width:64px;height:64px;border-radius:20px;background:#f0fdf4;border:1px solid #dcfce7;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10V7a5 5 0 0110 0v3" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="5" y="10" width="14" height="10" rx="3" stroke="#15803d" stroke-width="2"/>
              <circle cx="12" cy="15" r="1.5" fill="#15803d"/>
            </svg>
          </div>
          <p style="margin:0;color:#64748b;font-size:15px;line-height:1.5;">
            Informe seu e-mail institucional para receber as instruções de recuperação.
          </p>
        </div>
      `,
      input: "email",
      inputPlaceholder: "seu@aluno.ce.gov.br",
      showCancelButton: true,
      confirmButtonText: "Enviar instruções",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#15803d",
      cancelButtonColor: "#64748b",
      background: "#ffffff",
      color: "#0f172a",
      width: 460,
      padding: "2.2rem",
      customClass: {
        popup: "sectec-modal",
        title: "sectec-modal-title",
        input: "sectec-modal-input",
        confirmButton: "sectec-modal-confirm",
        cancelButton: "sectec-modal-cancel",
      },
    });

    if (!emailValue) return;

    Swal.fire({
      title: "Instruções enviadas",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div style="width:64px;height:64px;border-radius:20px;background:#f0fdf4;border:1px solid #dcfce7;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="#15803d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p style="margin:0;color:#64748b;font-size:15px;line-height:1.5;">
            Verifique sua caixa de entrada para redefinir sua senha.
          </p>
        </div>
      `,
      confirmButtonText: "Entendi",
      confirmButtonColor: "#15803d",
      background: "#ffffff",
      color: "#0f172a",
      width: 430,
      padding: "2rem",
      customClass: {
        popup: "sectec-modal",
        title: "sectec-modal-title",
        confirmButton: "sectec-modal-confirm",
      },
    });
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let data: LoginResponse;

    try {
      data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
    } catch (error) {
      Swal.fire({
        title: "Não foi possível entrar",
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
            <div style="width:64px;height:64px;border-radius:20px;background:#fef2f2;border:1px solid #fecaca;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1" fill="#dc2626"/>
                <path d="M10.29 3.86L1.82 18A2 2 0 003.53 21H20.47A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p style="margin:0;color:#64748b;font-size:15px;line-height:1.5;">
              ${
                error instanceof Error
                  ? error.message
                  : "Verifique seu e-mail e senha e tente novamente."
              }
            </p>
          </div>
        `,
        confirmButtonText: "Tentar novamente",
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
      return;
    }

    saveSession(data);
    localStorage.setItem("email", data.user.email ?? email);

    await Swal.fire({
      title: "Login realizado",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div style="width:64px;height:64px;border-radius:20px;background:#f0fdf4;border:1px solid #dcfce7;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="#15803d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p style="margin:0;color:#64748b;font-size:15px;line-height:1.5;">
            Bem-vindo ao sistema SECTEC.
          </p>
        </div>
      `,
      confirmButtonText: "Continuar",
      confirmButtonColor: "#15803d",
      background: "#ffffff",
      color: "#0f172a",
      width: 460,
      padding: "2.2rem",
      timer: 1400,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        popup: "sectec-modal",
        title: "sectec-modal-title",
        confirmButton: "sectec-modal-confirm",
      },
    });

    window.location.href = getRoleRedirect(data.role);
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
                <h2 className="text-3xl font-extrabold text-slate-900">Entrar</h2>
                <p className="text-slate-500 mt-2">Acesse sua conta para continuar.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    E-mail institucional
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@usuario"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
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

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-sectec-700 focus:ring-sectec-500"
                    />
                    <span className="text-sm text-slate-600">Lembrar usuário</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-sectec-700 py-3 px-4 text-white font-semibold text-base hover:bg-sectec-800 active:scale-[0.98] transition-all duration-150"
                >
                  Entrar
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-sectec-600 hover:text-sectec-700 hover:underline transition"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </form>
            </div>

            <p className="mt-8 text-xs text-slate-400 text-center">
              © 2026 SECTEC · Projeto Escolar · Ceará
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
