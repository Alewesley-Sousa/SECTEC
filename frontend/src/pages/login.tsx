import login from "../assets/img/Login.png";
import GoogleLoginButton from "../componentes/Button/GoogleLoginButton";

function Login() {
  function handleGoogleLogin() {
    console.log("Login com Google");
  }

  return (
    <main className="flex min-h-screen font-[Poppins]">
      <section className="grid w-full lg:grid-cols-2">

        {/* Painel esquerdo — imagem */}
        <div className="hidden bg-sectec-50 lg:block">
          <img
            src={login}
            alt="Ilustração de estudos e apresentações"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Painel direito — formulário */}
        <div className="flex items-center justify-center px-8 py-12 bg-white">
          <div className="w-full max-w-md text-center">

            {/* Logo */}
            <div className="mb-16 flex justify-center">
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-2 gap-1">
                  <span className="h-8 w-8 rounded-lg bg-sectec-700" />
                  <span className="h-8 w-8 rounded-lg bg-sectec-100" />
                  <span className="h-8 w-8 rounded-lg bg-sectec-600" />
                  <span className="h-8 w-8 rounded-lg bg-sectec-700" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-extrabold text-green-900">SECTEC</h1>
                  <p className="text-lg text-green-600">Projeto Escolar</p>
                </div>
              </div>
            </div>

            {/* Título */}
            <h2 className="text-4xl font-extrabold text-slate-900">Bem-vindo(a)!</h2>
            <p className="mx-auto mt-5 max-w-sm text-lg leading-8 text-slate-500">
              Acesse com sua conta institucional para continuar.
            </p>

            {/* Botão */}
            <div className="mt-12">
              <GoogleLoginButton onClick={handleGoogleLogin} />
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">acesso restrito</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Card de aviso */}
            <div className="text-left bg-sectec-50 border border-sectec-200 rounded-lg p-4 flex gap-2 items-start">
              <div className="w-5 h-5 rounded-full bg-sectec-600 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sectec-900">
                  Use apenas sua conta institucional
                </p>
                <p className="text-sm text-sectec-700 mt-0.5">
                  Somente emails @aluno.ce.gov.br são permitidos neste sistema.
                </p>
              </div>
            </div>

            {/* Rodapé */}
            <p className="mt-6 text-xs text-slate-400 text-center">
              © 2026 SECTEC · Projeto Escolar · Ceará
            </p>

          </div>
        </div>

      </section>
    </main>
  );
}

export default Login;