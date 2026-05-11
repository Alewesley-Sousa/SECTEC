import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import loginImg from "../assets/img/Login.png";
import registerImg from "../assets/img/login_esquerdo.png";
import {
  apiRequest,
  getRoleRedirect,
  saveSession,
  type LoginResponse,
} from "../lib/api";

type Mode = "login" | "register";
type Phase = "idle" | "exit" | "enter";

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [phase, setPhase] = useState<Phase>("idle");
  const [goingToRegister, setGoingToRegister] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function switchMode(next: Mode) {
    setFormError("");
    setGoingToRegister(next === "register");
    setPhase("exit");
    setTimeout(() => {
      setMode(next);
      setPhase("enter");
      setTimeout(() => setPhase("idle"), 400);
    }, 320);
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setLoading(true);

    try {
      const data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });

      saveSession(data);
      navigate(getRoleRedirect(data.role), { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Email ou senha inválidos."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    if (!email.endsWith("@aluno.ce.gov.br")) {
      setFormError("Use seu e-mail institucional @aluno.ce.gov.br.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("As senhas precisam ser iguais.");
      return;
    }

    if (password.length < 6) {
      setFormError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setFormError("Cadastro ainda não foi disponibilizado pelo backend.");
  }

  function getFormAnimation(): string {
    if (phase === "exit") {
      return goingToRegister ? "slideOutToLeft 0.32s ease forwards" : "slideOutToRight 0.32s ease forwards";
    }
    if (phase === "enter") {
      return goingToRegister ? "slideInFromRight 0.38s ease forwards" : "slideInFromLeft 0.38s ease forwards";
    }
    return "none";
  }

  function getImageAnimation(): string {
    if (phase !== "idle") return "imagePulse 0.6s ease forwards";
    return "none";
  }

  return (
    <main className="flex min-h-dvh overflow-x-hidden bg-white font-[Poppins]">
      <section
        className={`flex min-h-dvh w-full ${
          mode === "register" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="hidden bg-sectec-50 lg:block w-1/2 overflow-hidden">
          <img
            src={mode === "login" ? loginImg : registerImg}
            alt="Ilustração de estudos"
            className="h-full w-full object-cover"
            style={{ animation: getImageAnimation() }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center bg-white px-4 py-8 sm:px-8 sm:py-12">
          <div
            className="w-full max-w-md"
            style={{ animation: getFormAnimation() }}
          >
            <div className="mb-10 flex justify-center">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="grid grid-cols-2 gap-1">
                  <span className="h-7 w-7 rounded-lg bg-sectec-700" />
                  <span className="h-7 w-7 rounded-lg bg-sectec-100" />
                  <span className="h-7 w-7 rounded-lg bg-sectec-600" />
                  <span className="h-7 w-7 rounded-lg bg-sectec-700" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">SECTEC</h1>
                  <p className="text-sm text-green-600">Projeto Escolar</p>
                </div>
              </div>
            </div>

            {mode === "login" ? (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Entrar</h2>
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
                      placeholder="seu@aluno.ce.gov.br"
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Senha
                      </label>
                      <button type="button" className="text-xs text-sectec-600 hover:underline">
                        Esqueceu a senha?
                      </button>
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-sectec-700 py-3 px-4 text-white font-semibold text-base hover:bg-sectec-800 active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Ainda não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-semibold text-sectec-600 hover:underline"
                  >
                    Criar conta
                  </button>
                </p>
              </div>

            ) : (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Criar conta</h2>
                  <p className="text-slate-500 mt-2">Preencha os dados para se registrar.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                      Nome completo
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu Nome Completo"
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">
                      E-mail institucional
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@aluno.ce.gov.br"
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
                        Senha
                      </label>
                      <input
                        id="reg-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1">
                        Confirmar
                      </label>
                      <input
                        id="confirm"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 items-start bg-sectec-50 border border-sectec-200 rounded-lg p-3">
                    <div className="w-4 h-4 rounded-full bg-sectec-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <p className="text-xs text-sectec-700">
                      Use apenas seu e-mail <strong>@aluno.ce.gov.br</strong>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-sectec-700 py-3 px-4 text-white font-semibold text-base hover:bg-sectec-800 active:scale-[0.98] transition-all duration-150"
                  >
                    Criar conta
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-sectec-600 hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              </div>
            )}

            {formError && (
              <p className="mt-5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">
                {formError}
              </p>
            )}

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
