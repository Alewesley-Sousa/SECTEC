import { useState } from "react";
import loginImg from "../assets/img/Login.png";
import registerImg from "../assets/img/login_esquerdo.png";

type Mode = "login" | "register";
type Phase = "idle" | "exit" | "enter";

function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [phase, setPhase] = useState<Phase>("idle");
  const [goingToRegister, setGoingToRegister] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function switchMode(next: Mode) {
    setGoingToRegister(next === "register");
    setPhase("exit");
    setTimeout(() => {
      setMode(next);
      setPhase("enter");
      setTimeout(() => setPhase("idle"), 400);
    }, 320);
  }

  // 👇 handleLogin agora está DENTRO da função e acessa email/password
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert('Email ou senha inválidos');
      return;
    }

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role);

    if (data.role === 'aluno') window.location.href = '/dashboard/aluno';
    if (data.role === 'orientador') window.location.href = '/dashboard/orientador';
    if (data.role === 'coordenador') window.location.href = '/dashboard/coordenacao';
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    console.log("Criando conta com:", { name, email, password, confirmPassword });
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
    <main className="flex min-h-screen font-[Poppins] overflow-hidden">
      <section
        className={`flex w-full ${
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

        <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
          <div
            className="w-full max-w-md"
            style={{ animation: getFormAnimation() }}
          >
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

            {mode === "login" ? (
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
                    className="w-full rounded-lg bg-sectec-700 py-3 px-4 text-white font-semibold text-base hover:bg-sectec-800 active:scale-[0.98] transition-all duration-150"
                  >
                    Entrar
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
                  <h2 className="text-3xl font-extrabold text-slate-900">Criar conta</h2>
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

                  <div className="grid grid-cols-2 gap-3">
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